# Banco de dados inicial

Este schema foi pensado a partir do mockup em [nutri_saas_mockup_v2.html](/C:/Users/moise/OneDrive/Anexos/Documentos/nutriudf/nutri_saas_mockup_v2.html), com foco nos fluxos de nutricionista, pacientes, consultas, plano alimentar, catálogo TBCA, micronutrientes e hidratação.

## Stack assumida

- Banco: PostgreSQL
- Identificadores: UUID com `gen_random_uuid()`
- Datas operacionais: `TIMESTAMPTZ`

## Mapeamento do mockup para o banco

- "Dra. Ana Nunes" e perfis de acesso: `app_user` e `nutritionist_profile`
- "Pacientes" e status como "Em dia" / "Atenção": `patient`
- Peso, altura, IMC e evolução clínica: `patient_metric`
- "Nova consulta" e agenda: `consultation`
- "Plano alimentar": `diet_plan`
- Refeições do plano como café da manhã e almoço: `diet_plan_meal`
- Itens da refeição e porções: `diet_plan_meal_item`
- "Banco TBCA" e busca de alimentos: `food`
- Micronutrientes por alimento: `nutrient` e `food_nutrient`
- "Ingestão de água": `hydration_goal` e `hydration_log`

## Decisões de modelagem

- Os macronutrientes principais ficam duplicados em `food` para busca rápida e uso frequente na UI.
- Os micronutrientes ficam normalizados em `nutrient` e `food_nutrient`, porque a lista tende a crescer.
- O plano alimentar não salva macros calculados por item; esses valores podem ser derivados do alimento e da porção. Se você quiser histórico congelado mesmo após atualizar a base TBCA, vale adicionar colunas snapshot em `diet_plan_meal_item`.
- Hidratação foi separada entre meta e lançamentos para permitir histórico e mudança de meta ao longo do tempo.

## Ordem sugerida de implementação

1. Criar o banco com [db/schema.sql](/C:/Users/moise/OneDrive/Anexos/Documentos/nutriudf/db/schema.sql).
2. Popular `nutrient` com referências como cálcio, ferro, vitamina C, vitamina D, niacina e outros que aparecem no produto.
3. Importar a TBCA para `food` e `food_nutrient`.
4. Construir primeiro as telas de pacientes, consultas e plano alimentar.
5. Depois ligar os cálculos de resumo diário e alertas nutricionais.

## Estrutura criada

- Schema base: [db/schema.sql](/C:/Users/moise/OneDrive/Anexos/Documentos/nutriudf/db/schema.sql)
- Migration inicial: [db/migrations/0001_initial_schema.sql](/C:/Users/moise/OneDrive/Anexos/Documentos/nutriudf/db/migrations/0001_initial_schema.sql)
- Migration TBCA: [db/migrations/0002_tbca_import_support.sql](/C:/Users/moise/OneDrive/Anexos/Documentos/nutriudf/db/migrations/0002_tbca_import_support.sql)
- Guia de importação: [docs/tbca-import.md](/C:/Users/moise/OneDrive/Anexos/Documentos/nutriudf/docs/tbca-import.md)
