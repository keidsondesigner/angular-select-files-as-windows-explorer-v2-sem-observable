# Seleção de Documentos com Estilo Windows Explorer - Selection of Documents as Windows Explorer style

Este projeto implementa um gerenciador de documentos com funcionalidade de múltipla similar ao Windows Explorer, permitindo aos usuários selecionar arquivos de forma intuitiva.

## Detalhamento dos Métodos

### Constructor e Ciclo de Vida:

- ``constructor(private renderer: Renderer2)``: Inicializa o serviço ``Renderer2`` para manipulação segura do DOM
- ``ngOnInit()``: Configura os listeners globais para ``cliques`` e ``mouseup``
- ``ngAfterViewInit()``: Observa mudanças nos elementos do documento
- ``ngOnDestroy()``: Limpa os listeners quando o componente é destruído

### Métodos de Seleção por Arrasto:
- ``startDragSelection(event: MouseEvent)``: Inicia a seleção por arrasto
  - Verifica se o clique foi em área válida
  - Mantém seleção anterior se ``Ctrl`` estiver pressionado
  - Inicializa as coordenadas da seleção

- ``updateDragSelection(event: MouseEvent)``: Atualiza a seleção durante o arrasto
  - Atualiza coordenadas da caixa de seleção
  - Verifica interseção com documentos
  - Gerencia seleção múltipla com ``Ctrl``

- ``endDragSelection()``: Finaliza a seleção por arrasto
  - Define isDragging como false

### Métodos de Manipulação da Caixa de Seleção:
- ``getSelectionBoxLeft()``: Retorna posição esquerda da caixa
- ``getSelectionBoxTop()``: Retorna posição superior da caixa
- ``getSelectionBoxWidth()``: Calcula largura da caixa
- ``getSelectionBoxHeight()``: Calcula altura da caixa

### Métodos de Upload e Processamento de Arquivos:
- ``onFileSelected(event: Event)``: Processa arquivos selecionados via input
- ``onDragOver(event: DragEvent)``: Permite soltar arquivos na zona de upload
- ``onDrop(event: DragEvent)``: Processa arquivos soltos na zona
- ``processFiles(files: File[])``: Processa lista de arquivos
- ``isValidFileType(file: File)``: Verifica se tipo do arquivo é válido
- ``createDocumentItem(file: File)``: Cria novo item de documento
- ``generatePdfThumbnail(file: File)``: Gera miniatura para arquivos PDF

### Métodos de Seleção Manual:
- ``toggleSelection(event: Event, doc: DocumentItem)``: Alterna seleção de um item
- ``clearSelection()``: Limpa todas as seleções
- ``hasSelectedItems()``: Verifica se há itens selecionados
- ``hasMultipleSelectedItems()``: Verifica se há múltiplos itens selecionados

### Métodos de Agrupamento:
- ``groupSelectedDocuments()``: Agrupa documentos selecionados
- ``onContainerClick(event: Event)``: Previne propagação de cliques
- ``handleMouseLeave(event: MouseEvent)``: Trata quando mouse sai do container

### Métodos Auxiliares:
- ``generateUniqueId()``: Gera ID único para documentos
- ``generateGroupId()``: Gera ID único para grupos

## Funcionalidades Principais

### 1. Seleção de Arquivos
- **Seleção Individual**: Clique simples em um arquivo
- **Seleção Múltipla por Ctrl**: Mantenha ``Ctrl`` pressionado para selecionar múltiplos arquivos
- **Seleção por Arrasto**: Similar ao Windows Explorer
  - Clique e arraste para criar uma área de seleção
  - Mantenha Ctrl pressionado durante o arrasto para adicionar à seleção existente
  - A seleção funciona mesmo quando o mouse sai da área do container

### 2. Upload de Arquivos
- **Formatos Suportados**: PDF, JPEG, PNG
- **Métodos de Upload**:
  - Clique na área de upload
  - Arraste e solte arquivos
- **Processamento Automático**:
  - Geração de miniaturas para imagens
  - Conversão da primeira página de PDFs em miniatura

### 3. Gerenciamento de Documentos
- **Visualização em Grid**: Layout responsivo de documentos
- **Informações do Documento**:
  - Miniatura do arquivo
  - Nome do arquivo
  - Indicador de grupo (se agrupado)
- **Agrupamento**: Possibilidade de agrupar múltiplos documentos selecionados



## >>>>> Métodos Principais



### Seleção e Interação
- `startDragSelection`: Inicia a seleção por arrasto
- `updateDragSelection`: Atualiza área de seleção durante o arrasto
- `endDragSelection`: Finaliza a seleção
- `toggleSelection`: Alterna seleção individual de documentos
- `clearSelection`: Limpa todas as seleções

### Upload e Processamento
- `onFileSelected`: Processa arquivos selecionados via input
- `onDrop`: Processa arquivos arrastados
- `processFiles`: Valida e processa arquivos
- `createDocumentItem`: Cria novo item de documento
- `generatePdfThumbnail`: Gera miniatura para PDFs

### Utilitários
- `hasSelectedItems`: Verifica existência de itens selecionados
- `hasMultipleSelectedItems`: Verifica seleção múltipla
- `groupSelectedDocuments`: Agrupa documentos selecionados

## Boas Práticas Implementadas

### Angular
- Uso de `ViewChildren` para acesso ao DOM
- `Renderer2` para manipulação segura do DOM
- Gerenciamento apropriado do ciclo de vida dos componentes
- Limpeza adequada de event listeners

### Manipulação do DOM
- Evita manipulação direta do DOM
- Usa ElementRef para referências seguras
- Implementa detecção de interseção otimizada

### Gestão de Estado
- Estado centralizado no componente
- Atualizações reativas da interface
- Lógica clara de seleção e agrupamento

## Como Usar

1. **Seleção de Arquivos**:
   - Clique em um arquivo para selecionar
   - Ctrl + Clique para seleção múltipla
   - Clique e arraste para seleção em área

2. **Upload**:
   - Clique na área de upload ou
   - Arraste arquivos para a área de upload

3. **Agrupamento**:
   - Selecione múltiplos arquivos
   - Clique em "Group Selected"

4. **Limpar Seleção**:
   - Clique em "Clear Selection" ou
   - Clique fora da área de documentos

## Implementação Técnica

### Interface de Seleção
```typescript
interface DragSelection {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
}
```

### Principais Métodos

#### 1. Início da Seleção
```typescript
startDragSelection(event: MouseEvent) {
  // Verifica se o clique foi em área válida
  if (elementosInvalidos) return;

  // Limpa seleção anterior se Ctrl não estiver pressionado
  if (!event.ctrlKey) {
    this.clearSelection();
  }

  // Inicia nova seleção
  this.dragSelection = {
    startX: event.clientX,
    startY: event.clientY,
    currentX: event.clientX,
    currentY: event.clientY,
    isDragging: true
  };
}
```

#### 2. Atualização da Seleção
```typescript
updateDragSelection(event: MouseEvent) {
  if (!this.dragSelection.isDragging) return;

  // Atualiza coordenadas atuais
  this.dragSelection.currentX = event.clientX;
  this.dragSelection.currentY = event.clientY;

  // Calcula área de seleção
  const selectionBox = {
    left: Math.min(this.dragSelection.startX, this.dragSelection.currentX),
    top: Math.min(this.dragSelection.startY, this.dragSelection.currentY),
    right: Math.max(this.dragSelection.startX, this.dragSelection.currentX),
    bottom: Math.max(this.dragSelection.startY, this.dragSelection.currentY)
  };

  // Verifica interseção com itens
  this.checkIntersection(selectionBox);
}
```

### Estilos CSS Importantes

```css
.selection-box {
  position: fixed;
  border: 1px solid #99c9ff;
  background-color: rgba(0, 123, 255, 0.1);
  pointer-events: none;
  z-index: 1000;
}

.document-item.selected {
  border-color: #007bff;
  background-color: rgba(0, 123, 255, 0.1);
}
```

## Características Técnicas

1. **Prevenção de Seleção de Texto**
   - Utiliza `user-select: none` para evitar seleção indesejada de texto

2. **Gerenciamento de Estado**
   - Mantém estado de seleção para cada item
   - Controle de estado do arrasto (dragging)
   - Coordenadas de início e fim da seleção

3. **Otimizações**
   - Uso de eventos do DOM para detecção de clique fora
   - Cálculo eficiente de interseção de elementos
   - Atualização seletiva de estados

4. **Acessibilidade**
   - Suporte a interações via teclado (Ctrl)
   - Feedback visual claro para estados selecionados
   - Indicadores visuais durante a seleção