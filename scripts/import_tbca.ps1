param(
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl,

  [Parameter(Mandatory = $true)]
  [string]$SourceLabel,

  [string]$SourceVersion = "",

  [string]$FoodsCsv = ".\db\import_tbca\templates\foods.csv",

  [string]$NutrientsCsv = ".\db\import_tbca\templates\nutrients.csv",

  [string]$FoodNutrientsCsv = ".\db\import_tbca\templates\food_nutrients.csv"
)

$ErrorActionPreference = "Stop"

function Resolve-ProjectPath {
  param([string]$PathValue)

  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return $PathValue
  }

  return [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\$PathValue"))
}

$foodsPath = Resolve-ProjectPath $FoodsCsv
$nutrientsPath = Resolve-ProjectPath $NutrientsCsv
$foodNutrientsPath = Resolve-ProjectPath $FoodNutrientsCsv

$batchId = [guid]::NewGuid().ToString()

$insertBatchSql = @"
INSERT INTO tbca_import_batch (id, source_label, source_version)
VALUES ('$batchId', '$SourceLabel', NULLIF('$SourceVersion', ''));
"@

Write-Host "Criando lote de importacao TBCA: $batchId"
psql $DatabaseUrl -v ON_ERROR_STOP=1 -c $insertBatchSql

$tempFoods = Join-Path $env:TEMP "tbca_foods_$batchId.csv"
$tempNutrients = Join-Path $env:TEMP "tbca_nutrients_$batchId.csv"
$tempFoodNutrients = Join-Path $env:TEMP "tbca_food_nutrients_$batchId.csv"

Import-Csv $foodsPath | ForEach-Object {
  [PSCustomObject]@{
    batch_id = $batchId
    tbca_code = $_.tbca_code
    food_name = $_.food_name
    category = $_.category
    default_base_quantity = $_.default_base_quantity
    default_base_unit = $_.default_base_unit
    kcal = $_.kcal
    protein_g = $_.protein_g
    carbs_g = $_.carbs_g
    fat_g = $_.fat_g
    fiber_g = $_.fiber_g
    sodium_mg = $_.sodium_mg
  }
} | Export-Csv $tempFoods -NoTypeInformation -Encoding UTF8

Import-Csv $nutrientsPath | ForEach-Object {
  [PSCustomObject]@{
    batch_id = $batchId
    nutrient_slug = $_.nutrient_slug
    display_name = $_.display_name
    unit = $_.unit
    daily_reference_value = $_.daily_reference_value
    reference_source = $_.reference_source
  }
} | Export-Csv $tempNutrients -NoTypeInformation -Encoding UTF8

Import-Csv $foodNutrientsPath | ForEach-Object {
  [PSCustomObject]@{
    batch_id = $batchId
    tbca_code = $_.tbca_code
    nutrient_slug = $_.nutrient_slug
    amount_per_base = $_.amount_per_base
  }
} | Export-Csv $tempFoodNutrients -NoTypeInformation -Encoding UTF8

psql $DatabaseUrl -v ON_ERROR_STOP=1 -c "\copy tbca_food_staging (batch_id, tbca_code, food_name, category, default_base_quantity, default_base_unit, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg) FROM '$tempFoods' WITH (FORMAT csv, HEADER true)"
psql $DatabaseUrl -v ON_ERROR_STOP=1 -c "\copy tbca_nutrient_staging (batch_id, nutrient_slug, display_name, unit, daily_reference_value, reference_source) FROM '$tempNutrients' WITH (FORMAT csv, HEADER true)"
psql $DatabaseUrl -v ON_ERROR_STOP=1 -c "\copy tbca_food_nutrient_staging (batch_id, tbca_code, nutrient_slug, amount_per_base) FROM '$tempFoodNutrients' WITH (FORMAT csv, HEADER true)"
psql $DatabaseUrl -v ON_ERROR_STOP=1 -v batch_id=$batchId -f (Join-Path $PSScriptRoot "..\db\import_tbca\upsert_from_staging.sql")

Remove-Item $tempFoods, $tempNutrients, $tempFoodNutrients -ErrorAction SilentlyContinue

Write-Host "Importacao concluida para o lote $batchId"
