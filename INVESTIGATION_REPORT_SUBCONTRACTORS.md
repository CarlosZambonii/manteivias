# Relatório de Investigação: Visibilidade de Subempreiteiros

## 1. Resumo do Problema
Os subempreiteiros recém-adicionados ou geridos através da aba "Área Organizacional > Subempreiteiros" (`OrganizationalAreaPage.jsx` / `SubcontractorDataTable.jsx`) não estão a aparecer na aba de "Central de Validações > Subempreiteiros" (`AdminValidationPage.jsx` / `SubcontractorValidationTab.jsx`). 

## 2. Análise Detalhada do Código

### Implementação na Área Organizacional (`SubcontractorDataTable.jsx`)
Na função `fetchSubcontractors`, os subempreiteiros são consultados usando a seguinte lógica: