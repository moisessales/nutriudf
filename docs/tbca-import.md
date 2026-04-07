# Estrutura de importação da TBCA

Esta pasta prepara um fluxo em duas etapas:

1. carregar CSVs brutos em tabelas de staging;
2. aplicar upsert no catálogo principal do app.

## Arquivos criados

- Migration inicial: [0001_initial_schema.sql](/C:/Users/moise/OneDrive/Anexos/Documentos/nutriudf/db/migrations/0001_initial_schema.sql)
- Migration de suporte à importação: [0002_tbca_import_support.sql](/C:/Users/moise/OneDrive/Anexos/Documentos/nutriudf/db/migrations/0002_tbca_import_support.sql)
- Script de importação: [import_tbca.ps1](/C:/Users/moise/OneDrive/Anexos/Documentos/nutriudf/scripts/import_tbca.ps1)
- Gerador JSON para a API interna: [build_tbca_json.ps1](/C:/Users/moise/OneDrive/Anexos/Documentos/nutriudf/scripts/build_tbca_json.ps1)
- SQL de upsert: [upsert_from_staging.sql](/C:/Users/moise/OneDrive/Anexos/Documentos/nutriudf/db/import_tbca/upsert_from_staging.sql)
- Templates CSV: [foods.csv](/C:/Users/moise/OneDrive/Anexos/Documentos/nutriudf/db/import_tbca/templates/foods.csv), [nutrients.csv](/C:/Users/moise/OneDrive/Anexos/Documentos/nutriudf/db/import_tbca/templates/nutrients.csv), [food_nutrients.csv](/C:/Users/moise/OneDrive/Anexos/Documentos/nutriudf/db/import_tbca/templates/food_nutrients.csv)

## Tabelas de staging

- `tbca_import_batch`: rastreia cada carga
- `tbca_food_staging`: alimentos brutos
- `tbca_nutrient_staging`: nutrientes brutos
- `tbca_food_nutrient_staging`: relação alimento x nutriente

## Fluxo sugerido

1. Aplicar as migrations em ordem.
2. Substituir os CSVs de exemplo pelos arquivos transformados da TBCA.
3. Rodar o script PowerShell:

```powershell
.\scripts\import_tbca.ps1 `
  -DatabaseUrl "postgresql://usuario:senha@localhost:5432/nutriudf" `
  -SourceLabel "TBCA" `
  -SourceVersion "7.2"
```

4. Conferir as tabelas `food`, `nutrient` e `food_nutrient`.
5. Gerar o JSON usado pela API interna do mockup/backend atual:

```powershell
.\scripts\build_tbca_json.ps1 `
  -FoodsCsv ".\db\import_tbca\templates\foods.csv" `
  -NutrientsCsv ".\db\import_tbca\templates\nutrients.csv" `
  -FoodNutrientsCsv ".\db\import_tbca\templates\food_nutrients.csv" `
  -OutputPath ".\backend\src\data\tbcaFoods.json"
```

## Observações

- Os templates estão em formato simplificado para acelerar a primeira importação.
- A TBCA original pode vir em Excel, CSV ou layout diferente. Nesse caso, a etapa que ainda falta é um transformador para converter o arquivo oficial nesses três CSVs.
- O script assume que `psql` está disponível no PATH.
- O projeto não deve embutir uma cópia integral da TBCA obtida por raspagem. Para uso completo, coloque os arquivos oficiais que você tem direito de usar nesses CSVs e gere o JSON local a partir deles.

## Próximo passo ideal

Quando você me passar o arquivo real da TBCA, eu posso montar o transformador exato para esse layout e deixar a importação pronta de ponta a ponta.
