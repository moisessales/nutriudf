param(
  [string]$FoodsCsv = ".\db\import_tbca\templates\foods.csv",

  [string]$NutrientsCsv = ".\db\import_tbca\templates\nutrients.csv",

  [string]$FoodNutrientsCsv = ".\db\import_tbca\templates\food_nutrients.csv",

  [string]$OutputPath = ".\backend\src\data\tbcaFoods.json"
)

$ErrorActionPreference = "Stop"

function Resolve-ProjectPath {
  param([string]$PathValue)

  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return $PathValue
  }

  return [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\$PathValue"))
}

function Remove-Diacritics {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ""
  }

  $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object System.Text.StringBuilder

  foreach ($char in $normalized.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($char) -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }

  return $builder.ToString().Normalize([Text.NormalizationForm]::FormC)
}

function Normalize-Token {
  param([string]$Value)

  $ascii = Remove-Diacritics $Value
  return (($ascii.ToLowerInvariant() -replace '[^a-z0-9]+', '_') -replace '^_+|_+$', '')
}

function Parse-NumericValue {
  param([object]$Value)

  if ($null -eq $Value) {
    return $null
  }

  $text = $Value.ToString().Trim()
  if ([string]::IsNullOrWhiteSpace($text)) {
    return $null
  }

  if ($text -match '^(?i:na|nd|-)$') {
    return $null
  }

  if ($text -match '^(?i:tr)$') {
    return 0
  }

  $normalized = $text.Replace(',', '.')
  $parsed = 0.0
  if ([double]::TryParse($normalized, [Globalization.NumberStyles]::Float, [Globalization.CultureInfo]::InvariantCulture, [ref]$parsed)) {
    return [Math]::Round($parsed, 4)
  }

  return $null
}

function Format-ReferenceAmount {
  param([object]$Quantity, [string]$Unit)

  $parsedQuantity = Parse-NumericValue $Quantity
  $normalizedUnit = if ([string]::IsNullOrWhiteSpace($Unit)) { 'g' } else { $Unit.Trim() }

  if ($null -eq $parsedQuantity) {
    return "100$normalizedUnit"
  }

  if ([Math]::Abs($parsedQuantity - [Math]::Round($parsedQuantity)) -lt 0.0001) {
    return "$([int][Math]::Round($parsedQuantity))$normalizedUnit"
  }

  return "$parsedQuantity$normalizedUnit"
}

$knownFieldMap = @{
  'calcio' = 'calcio_mg'
  'ferro' = 'ferro_mg'
  'sodio' = 'sodio_mg'
  'potassio' = 'potassio_mg'
  'magnesio' = 'magnesio_mg'
  'fosforo' = 'fosforo_mg'
  'zinco' = 'zinco_mg'
  'cobre' = 'cobre_mg'
  'selenio' = 'selenio_mcg'
  'manganes' = 'manganes_mg'
  'manganesio' = 'manganes_mg'
  'vitamina_a' = 'vitamina_a_mcg'
  'vitamina_c' = 'vitamina_c_mg'
  'vitamina_d' = 'vitamina_d_mcg'
  'vitamina_e' = 'vitamina_e_mg'
  'vitamina_b1' = 'vitamina_b1_mg'
  'tiamina' = 'vitamina_b1_mg'
  'vitamina_b2' = 'vitamina_b2_mg'
  'riboflavina' = 'vitamina_b2_mg'
  'vitamina_b3' = 'vitamina_b3_mg'
  'niacina' = 'vitamina_b3_mg'
  'vitamina_b6' = 'vitamina_b6_mg'
  'vitamina_b12' = 'vitamina_b12_mcg'
  'folato' = 'folato_mcg'
  'equivalente_folato' = 'folato_mcg'
}

function Resolve-JsonFieldName {
  param([string]$Slug, [string]$Unit)

  $normalizedSlug = Normalize-Token $Slug
  if ($knownFieldMap.ContainsKey($normalizedSlug)) {
    return $knownFieldMap[$normalizedSlug]
  }

  $normalizedUnit = Normalize-Token $Unit
  if ([string]::IsNullOrWhiteSpace($normalizedUnit)) {
    $normalizedUnit = 'value'
  }

  return "${normalizedSlug}_${normalizedUnit}"
}

$foodsPath = Resolve-ProjectPath $FoodsCsv
$nutrientsPath = Resolve-ProjectPath $NutrientsCsv
$foodNutrientsPath = Resolve-ProjectPath $FoodNutrientsCsv
$outputFilePath = Resolve-ProjectPath $OutputPath

if (-not (Test-Path $foodsPath)) {
  throw "Arquivo foods.csv não encontrado: $foodsPath"
}

if (-not (Test-Path $nutrientsPath)) {
  throw "Arquivo nutrients.csv não encontrado: $nutrientsPath"
}

if (-not (Test-Path $foodNutrientsPath)) {
  throw "Arquivo food_nutrients.csv não encontrado: $foodNutrientsPath"
}

$foodsRows = Import-Csv $foodsPath
$nutrientRows = Import-Csv $nutrientsPath
$foodNutrientRows = Import-Csv $foodNutrientsPath

$nutrientMap = @{}
foreach ($row in $nutrientRows) {
  $normalizedSlug = Normalize-Token $row.nutrient_slug
  if ([string]::IsNullOrWhiteSpace($normalizedSlug)) {
    continue
  }

  $nutrientMap[$normalizedSlug] = [ordered]@{
    slug = $row.nutrient_slug
    displayName = $row.display_name
    unit = $row.unit
    dailyReferenceValue = Parse-NumericValue $row.daily_reference_value
    referenceSource = $row.reference_source
    jsonField = Resolve-JsonFieldName $row.nutrient_slug $row.unit
  }
}

$foodsByCode = [ordered]@{}
$currentId = 1

foreach ($row in $foodsRows) {
  if ([string]::IsNullOrWhiteSpace($row.tbca_code)) {
    continue
  }

  $energiaKcal = Parse-NumericValue $row.kcal
  if ($null -eq $energiaKcal) { $energiaKcal = 0 }

  $proteinaG = Parse-NumericValue $row.protein_g
  if ($null -eq $proteinaG) { $proteinaG = 0 }

  $carboidratoG = Parse-NumericValue $row.carbs_g
  if ($null -eq $carboidratoG) { $carboidratoG = 0 }

  $lipideosG = Parse-NumericValue $row.fat_g
  if ($null -eq $lipideosG) { $lipideosG = 0 }

  $fibraG = Parse-NumericValue $row.fiber_g
  if ($null -eq $fibraG) { $fibraG = 0 }

  $sodioMg = Parse-NumericValue $row.sodium_mg
  if ($null -eq $sodioMg) { $sodioMg = 0 }

  $foodRecord = [ordered]@{
    id = $currentId
    code = $row.tbca_code
    tbca_code = $row.tbca_code
    name = $row.food_name
    category = $row.category
    reference_amount = Format-ReferenceAmount $row.default_base_quantity $row.default_base_unit
    default_base_quantity = Parse-NumericValue $row.default_base_quantity
    default_base_unit = if ([string]::IsNullOrWhiteSpace($row.default_base_unit)) { 'g' } else { $row.default_base_unit }
    energia_kcal = $energiaKcal
    proteina_g = $proteinaG
    carboidrato_g = $carboidratoG
    lipideos_g = $lipideosG
    fibra_g = $fibraG
    sodio_mg = $sodioMg
    nutrients = [ordered]@{}
  }

  $foodsByCode[$row.tbca_code] = $foodRecord
  $currentId += 1
}

foreach ($row in $foodNutrientRows) {
  if ([string]::IsNullOrWhiteSpace($row.tbca_code) -or -not $foodsByCode.Contains($row.tbca_code)) {
    continue
  }

  $normalizedSlug = Normalize-Token $row.nutrient_slug
  if ([string]::IsNullOrWhiteSpace($normalizedSlug)) {
    continue
  }

  $amount = Parse-NumericValue $row.amount_per_base
  if ($null -eq $amount) {
    continue
  }

  $nutrientMeta = if ($nutrientMap.ContainsKey($normalizedSlug)) { $nutrientMap[$normalizedSlug] } else { $null }
  $jsonField = if ($null -ne $nutrientMeta) {
    $nutrientMeta.jsonField
  } else {
    Resolve-JsonFieldName $row.nutrient_slug ''
  }

  $foodRecord = $foodsByCode[$row.tbca_code]
  $foodRecord.nutrients[$jsonField] = $amount

  if (-not $foodRecord.Contains($jsonField) -or $null -eq $foodRecord[$jsonField]) {
    $foodRecord[$jsonField] = $amount
  }
}

$finalFoods = @()
foreach ($foodRecord in $foodsByCode.Values) {
  if ($foodRecord.nutrients.Count -eq 0) {
    $foodRecord.Remove('nutrients')
  }

  $finalFoods += [PSCustomObject]$foodRecord
}

$outputDirectory = Split-Path -Parent $outputFilePath
if (-not (Test-Path $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outputFilePath, ($finalFoods | ConvertTo-Json -Depth 10), $utf8NoBom)

Write-Host "JSON TBCA gerado com sucesso em: $outputFilePath"
Write-Host "Alimentos exportados: $($finalFoods.Count)"