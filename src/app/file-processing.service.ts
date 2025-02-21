import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';

// Interface para documento
interface DocumentItem {
  id: string;
  file: File;
  preview: string;
  selected: boolean;
  groupId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileProcessingService {

  async processFiles(files: File[]): Promise<DocumentItem[]> {
    const documentItems: DocumentItem[] = [];
    for (const file of files) {
      if (this.isValidFileType(file)) {
        const documentItem = await this.createDocumentItem(file);
        documentItems.push(documentItem);
      }
    }
    return documentItems;
  }

  isValidFileType(file: File): boolean {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    return validTypes.includes(file.type);
  }

  async createDocumentItem(file: File): Promise<DocumentItem> {
    if (file.type === 'application/pdf') {
      const preview = await this.generatePdfThumbnail(file);
      return {
        id: Math.random().toString(36).substr(2, 9),
        file: file,
        preview: preview,
        selected: false
      };
    } else {
      return new Promise<DocumentItem>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            preview: e.target?.result as string,
            selected: false
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
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
      
      const thumbnailDoc = await PDFDocument.create();
      const [thumbnailPage] = await thumbnailDoc.copyPages(pdfDoc, [0]);
      thumbnailDoc.addPage(thumbnailPage);

      const pdfBytes = await thumbnailDoc.saveAsBase64({ dataUri: true });
      return pdfBytes;
    } catch (error) {
      console.error('Error generating PDF thumbnail:', error);
      return 'assets/pdf-icon.png';
    }
  }
} 