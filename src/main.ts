import { Component, OnInit, ViewChildren, QueryList, ElementRef, AfterViewInit, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { PDFDocument } from 'pdf-lib';

interface PosicaoElemento {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// Interface para documento
interface DocumentItem {
  id: string;
  file: File;
  preview: string;
  selected: boolean;
  groupId?: string;
}

// Interface para seleção por arrasto
interface DragSelection {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="document-container" 
         (mousedown)="startDragSelection($event)"
         (mouseup)="endDragSelection()"
         (mousemove)="updateDragSelection($event)"
         (mouseleave)="handleMouseLeave($event)"
         (click)="onContainerClick($event)">
      <h1>Selection of Documents as Windows Explorer style || Seleção de Documentos com Estilo Windows Explorer </h1>
      
      <div class="upload-zone" 
           (click)="fileInput.click()" 
           (dragover)="onDragOver($event)"
           (drop)="onDrop($event)">
        <input #fileInput 
               type="file" 
               [multiple]="true" 
               (change)="onFileSelected($event)"
               accept=".pdf,.jpg,.jpeg,.png"
               style="display: none">
        <p>Click or drag files here to upload</p>
        <p class="small">Supported formats: PDF, JPEG, PNG</p>
      </div>

      <div class="document-actions" *ngIf="hasSelectedItems()">
        <button class="btn btn-primary" 
                (click)="groupSelectedDocuments()"
                [disabled]="!hasMultipleSelectedItems()">
          Group Selected
        </button>
        <button class="btn btn-secondary" 
                (click)="clearSelection()">
          Clear Selection
        </button>
      </div>

      <div class="documents-grid">
        <div #documentItem *ngFor="let doc of documents" 
             class="document-item"
             [class.selected]="doc.selected"
             (click)="toggleSelection($event, doc)">
          <img [src]="doc.preview" 
               class="document-preview" 
               [alt]="doc.file.name">
          <div>{{ doc.file.name }}</div>
          <div *ngIf="doc.groupId" class="group-indicator">
            Group: {{ doc.groupId }}
          </div>
        </div>
      </div>

      <div *ngIf="dragSelection.isDragging"
           class="selection-box"
           [style.left.px]="getSelectionBoxLeft()"
           [style.top.px]="getSelectionBoxTop()"
           [style.width.px]="getSelectionBoxWidth()"
           [style.height.px]="getSelectionBoxHeight()">
      </div>
    </div>
  `
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('documentItem') documentItems!: QueryList<ElementRef>;
  private documentClickListener: (() => void) | undefined;
  private documentMouseUpListener: (() => void) | undefined;
  documents: DocumentItem[] = [];
  dragSelection: DragSelection = {
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false
  };
  
  constructor(private renderer: Renderer2) {}
  
  ngOnInit() {
    // Usando Renderer2 para lidar com cliques globais
    this.documentClickListener = this.renderer.listen('document', 'click', (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.document-container')) {
        this.clearSelection();
      }
    });

    // Adicionando listener global para mouseup
    this.documentMouseUpListener = this.renderer.listen('document', 'mouseup', () => {
      if (this.dragSelection.isDragging) {
        this.endDragSelection();
      }
    });
  }

  ngOnDestroy() {
    // Limpando os listeners quando o componente for destruído
    if (this.documentClickListener) {
      this.documentClickListener();
    }
    if (this.documentMouseUpListener) {
      this.documentMouseUpListener();
    }
  }

  ngAfterViewInit() {
    // Observar mudanças nos documentItems
    this.documentItems.changes.subscribe(() => {
      console.log('DocumentItems atualizados');
    });
  }

  startDragSelection(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (
      target.closest('.document-item') ||
      target.closest('button') ||
      target.closest('.upload-zone')
    ) {
      console.log('Seleção não iniciada - clique em área inválida');
      return;
    }

    // Limpa seleção anterior apenas se Ctrl não estiver pressionado
    if (!event.ctrlKey) {
      console.log('Ctrl não pressionado - limpando seleção anterior');
      this.clearSelection();
    }

    this.dragSelection = {
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      isDragging: true
    };
  }

  updateDragSelection(event: MouseEvent) {
    if (!this.dragSelection.isDragging) return;

    this.dragSelection.currentX = event.clientX;
    this.dragSelection.currentY = event.clientY;

    const caixaSelecao: PosicaoElemento = {
      left: Math.min(this.dragSelection.startX, this.dragSelection.currentX),
      top: Math.min(this.dragSelection.startY, this.dragSelection.currentY),
      right: Math.max(this.dragSelection.startX, this.dragSelection.currentX),
      bottom: Math.max(this.dragSelection.startY, this.dragSelection.currentY)
    };

    // Usando ViewChildren para acessar os elementos
    this.documentItems.forEach((elementRef, index) => {
      const documento = this.documents[index];
      if (!documento) return;

      const elemento = elementRef.nativeElement;
      const posicaoElemento: PosicaoElemento = elemento.getBoundingClientRect();
      const estaNaSelecao = this.isElementoNaAreaSelecao(posicaoElemento, caixaSelecao);
      
      documento.selected = this.determinaEstadoSelecao(
        documento.selected,
        estaNaSelecao,
        event.ctrlKey
      );
      
      console.log('Item', index, 'selecionado:', documento.selected);
    });

    const itensSelecionados = this.documents.filter(doc => doc.selected);
    console.log('Itens selecionados explorer select:', itensSelecionados);
  }

  /**
   * Verifica se um elemento está dentro ou intersecta com a área de seleção
   * 
   * Exemplo visual:
   * 
   *    Caso 1: Elemento fora          Caso 2: Elemento na seleção
   *    ┌─────┐   ┌─────┐                  ┌─────┐
   *    │  A  │   │  B  │                  │  A  │
   *    └─────┘   └─────┘                  └──┬──┘
   *                                          │
   *                                       ┌──┼──┐
   *                                       │  B  │
   *                                       └─────┘
   * 
   * @returns true se o elemento está dentro ou intersecta a área de seleção
   */
  private isElementoNaAreaSelecao(elemento: PosicaoElemento, posicaoCaixaSelecao: PosicaoElemento): boolean {
    // Verifica se o elemento está completamente fora da área de seleção
    const elementoEstaFora = 
      elemento.right < posicaoCaixaSelecao.left ||    // Elemento está totalmente à esquerda
      elemento.left > posicaoCaixaSelecao.right ||    // Elemento está totalmente à direita
      elemento.bottom < posicaoCaixaSelecao.top ||    // Elemento está totalmente acima
      elemento.top > posicaoCaixaSelecao.bottom;      // Elemento está totalmente abaixo

    // Se não está fora, então está dentro ou intersectando
    return !elementoEstaFora;
  }

  private determinaEstadoSelecao(elementoSelecionadoAtualmente: boolean, elementoEstaAreaSelecao: boolean, ctrlPressionado: boolean): boolean {
    // Com Ctrl pressionado: mantém seleção atual e adiciona novos elementos na área
    if (ctrlPressionado) {
      return elementoSelecionadoAtualmente || elementoEstaAreaSelecao;
    }
    
    // Sem Ctrl: estado é determinado apenas pela posição do elemento
    return elementoEstaAreaSelecao;
  }

  endDragSelection() {
    this.dragSelection.isDragging = false;
  }

  getSelectionBoxLeft(): number {
    return Math.min(this.dragSelection.startX, this.dragSelection.currentX);
  }

  getSelectionBoxTop(): number {
    return Math.min(this.dragSelection.startY, this.dragSelection.currentY);
  }

  getSelectionBoxWidth(): number {
    return Math.abs(this.dragSelection.currentX - this.dragSelection.startX);
  }

  getSelectionBoxHeight(): number {
    return Math.abs(this.dragSelection.currentY - this.dragSelection.startY);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.processFiles(Array.from(files));
    }
  }

  async processFiles(files: File[]) {
    for (const file of files) {
      if (this.isValidFileType(file)) {
        await this.createDocumentItem(file);
      }
    }
  }

  isValidFileType(file: File): boolean {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    return validTypes.includes(file.type);
  }

  async createDocumentItem(file: File) {
    if (file.type === 'application/pdf') {
      const preview = await this.generatePdfThumbnail(file);
      this.documents.push({
        id: Math.random().toString(36).substr(2, 9),
        file: file,
        preview: preview,
        selected: false
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.documents.push({
          id: Math.random().toString(36).substr(2, 9),
          file: file,
          preview: e.target?.result as string,
          selected: false
        });
      };
      reader.readAsDataURL(file);
    }
  }

  async generatePdfThumbnail(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      if (pdfDoc.getPageCount() === 0) {
        throw new Error('PDF has no pages');
      }

      const firstPage = pdfDoc.getPages()[0];
      const { width, height } = firstPage.getSize();
      
      // Create a new document for the thumbnail
      const thumbnailDoc = await PDFDocument.create();
      const [thumbnailPage] = await thumbnailDoc.copyPages(pdfDoc, [0]);
      thumbnailDoc.addPage(thumbnailPage);

      // Convert to PNG-like format
      const pdfBytes = await thumbnailDoc.saveAsBase64({ dataUri: true });
      return pdfBytes;
    } catch (error) {
      console.error('Error generating PDF thumbnail:', error);
      return 'assets/pdf-icon.png'; // Fallback to default icon
    }
  }

  toggleSelection(event: Event, doc: DocumentItem) {
    event.stopPropagation();
    doc.selected = !doc.selected;
    const itensSelecionados = this.documents.filter(doc => doc.selected);
    console.log('Itens selecionados:', itensSelecionados);
  }

  clearSelection() {
    this.documents.forEach(doc => doc.selected = false);
  }

  hasSelectedItems(): boolean {
    return this.documents.some(doc => doc.selected);
  }

  hasMultipleSelectedItems(): boolean {
    return this.documents.filter(doc => doc.selected).length > 1;
  }

  groupSelectedDocuments() {
    const groupId = Math.random().toString(36).substr(2, 9);
    this.documents
      .filter(doc => doc.selected)
      .forEach(doc => {
        doc.groupId = groupId;
        doc.selected = false;
      });
  }

  onContainerClick(event: Event) {
    event.stopPropagation();
  }

  handleMouseLeave(event: MouseEvent) {
    if (this.dragSelection.isDragging) {
      // Atualiza a posição atual mesmo quando o mouse sai do container
      this.updateDragSelection(event);
    }
  }
}

bootstrapApplication(App);