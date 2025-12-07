
import { KnowledgeDocument, KnowledgeChunk, KnowledgeCategory, User, ChatMessage } from '../types';
import { MOCK_KB_CATEGORIES, MOCK_KB_DOCS, MOCK_KB_CHUNKS } from './mockKBData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const kbService = {
  // 1. Get Categories
  getCategories: async (): Promise<KnowledgeCategory[]> => {
    await delay(200);
    return [...MOCK_KB_CATEGORIES];
  },

  // 2. Get Documents (All for list, permissions checked in search)
  getDocuments: async (categoryId?: string): Promise<KnowledgeDocument[]> => {
    await delay(300);
    if (categoryId) {
      return MOCK_KB_DOCS.filter(d => d.category_id === categoryId);
    }
    return [...MOCK_KB_DOCS];
  },

  // 3. Upload Document (Simulated Ingestion)
  uploadDocument: async (
    file: File, 
    meta: { 
      title: string; 
      category_id: string; 
      is_public: boolean; 
      allowed_roles: string[];
      allowed_dept_ids: string[]; 
    },
    user: User
  ): Promise<KnowledgeDocument> => {
    await delay(1000); // Simulate upload & embedding time

    // Create Doc
    const newDoc: KnowledgeDocument = {
      id: 'kb-doc-' + Date.now(),
      title: meta.title,
      category_id: meta.category_id,
      file_type: file.name.split('.').pop() as any || 'pdf',
      size: (file.size / 1024 / 1024).toFixed(1) + 'MB',
      uploaded_at: new Date().toISOString().split('T')[0],
      uploaded_by: user.name,
      is_public: meta.is_public,
      allowed_roles: meta.allowed_roles,
      allowed_dept_ids: meta.allowed_dept_ids,
      status: 'Indexed'
    };

    MOCK_KB_DOCS.push(newDoc);

    // Simulate Chunking (Mock: just create one chunk with generic text)
    const newChunk: KnowledgeChunk = {
      id: 'chk-' + Date.now(),
      document_id: newDoc.id,
      content_text: `(Simulated content of ${newDoc.title}) This document contains sensitive or public info based on upload settings.`,
      meta_is_public: newDoc.is_public,
      meta_allowed_roles: newDoc.allowed_roles,
      meta_allowed_dept_ids: newDoc.allowed_dept_ids
    };
    MOCK_KB_CHUNKS.push(newChunk);

    return newDoc;
  },

  // 4. Secure AI Search (The Brain)
  searchKnowledgeBase: async (query: string, user: User): Promise<ChatMessage> => {
    await delay(1500); // Simulate Vector Search + LLM Generation

    // --- SECURE RETRIEVAL LOGIC (Filter BEFORE Search) ---
    
    // Step A: Filter Chunks based on User Context
    const accessibleChunks = MOCK_KB_CHUNKS.filter(chunk => {
      // 1. If public, allow
      if (chunk.meta_is_public) return true;

      // 2. Check Dept
      if (chunk.meta_allowed_dept_ids.includes(user.department.id)) return true;

      // 3. Check Role (Intersection of arrays)
      const hasRole = chunk.meta_allowed_roles.some(r => user.roles.includes(r));
      if (hasRole) return true;

      return false; // Access Denied
    });

    // Step B: Keyword Search (Simulating Vector Similarity)
    // Simple naive includes check for demo
    const queryLower = query.toLowerCase();
    const relevantChunks = accessibleChunks.filter(chunk => 
      chunk.content_text.toLowerCase().includes(queryLower) ||
      MOCK_KB_DOCS.find(d => d.id === chunk.document_id)?.title.toLowerCase().includes(queryLower)
    ).slice(0, 3); // Top 3 results

    // Step C: Generate Answer
    let responseContent = "";
    const citations: any[] = [];

    if (relevantChunks.length === 0) {
      // Fallback for HR/PM database queries (Mocking "Tool Use")
      if (queryLower.includes('遲到') && user.roles.includes('staff')) {
         responseContent = "根據您的打卡紀錄查詢，本月目前無遲到紀錄。全勤獎金 NT$3,000 目前資格符合。";
      } else if (queryLower.includes('issue') && user.roles.includes('admin')) {
         responseContent = "已為您查詢 Github，Issue #102 當前狀態為 Open。是否需要我將其改為 In Progress？";
      } else {
         responseContent = "抱歉，我在您有權限訪問的知識庫中找不到相關資訊。";
      }
    } else {
      // Synthesize answer from chunks
      responseContent = "根據知識庫檢索結果：\n\n";
      relevantChunks.forEach((chunk, idx) => {
         const doc = MOCK_KB_DOCS.find(d => d.id === chunk.document_id);
         responseContent += `• ${chunk.content_text}\n`;
         if (doc) {
           citations.push({
             doc_id: doc.id,
             doc_title: doc.title,
             snippet: chunk.content_text.substring(0, 50) + "..."
           });
         }
      });
    }

    return {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString(),
      sources: citations.length > 0 ? citations : undefined
    };
  }
};
