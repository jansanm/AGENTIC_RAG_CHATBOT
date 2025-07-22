interface StoredDocument {
  id: string
  filename: string
  content: string
  fileType: string
  uploadTime: Date
  status: "processing" | "ready" | "error"
}

class DocumentStore {
  private documents: Map<string, StoredDocument> = new Map()

  store(id: string, filename: string, content: string, fileType: string): void {
    this.documents.set(id, {
      id,
      filename,
      content,
      fileType,
      uploadTime: new Date(),
      status: "processing",
    })
  }

  get(id: string): StoredDocument | undefined {
    return this.documents.get(id)
  }

  updateStatus(id: string, status: StoredDocument["status"]): void {
    const doc = this.documents.get(id)
    if (doc) {
      doc.status = status
    }
  }

  getAll(): StoredDocument[] {
    return Array.from(this.documents.values())
  }

  getByStatus(status: StoredDocument["status"]): StoredDocument[] {
    return Array.from(this.documents.values()).filter((doc) => doc.status === status)
  }
}

export const documentStore = new DocumentStore()
