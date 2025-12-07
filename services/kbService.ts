
import { KnowledgeDocument, KnowledgeChunk, KnowledgeCategory, User, ChatMessage } from '../types';
import { MOCK_KB_CATEGORIES, MOCK_KB_DOCS, MOCK_KB_CHUNKS } from './mockKBData';
import { permissionService } from './permissionService';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const kbService = {
  getCategories: async (): Promise<KnowledgeCategory[]> => {
    await delay(200);
    return [...MOCK_KB_CATEGORIES];
  },

  getDocuments: async (categoryId?: string): Promise<KnowledgeDocument[]> => {
    await delay(300);
    if (categoryId) {
      return MOCK_KB_DOCS.filter(d => d.category_id === categoryId);
    }
    return [...MOCK_KB_DOCS];
  },

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
    await delay(1000); 

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

    const newChunk: KnowledgeChunk = {
      id: 'chk-' + Date.now(),
      document_id: newDoc.id,
      content_text: `(Simulated content of ${newDoc.title}) This content is protected by RAG Permission Filter.`,
      meta_is_public: newDoc.is_public,
      meta_allowed_roles: newDoc.allowed_roles,
      meta_allowed_dept_ids: newDoc.allowed_dept_ids
    };
    MOCK_KB_CHUNKS.push(newChunk);

    return newDoc;
  },

  // 4. Secure AI Search (The Brain) with Permission Service
  searchKnowledgeBase: async (query: string, user: User): Promise<ChatMessage> => {
    await delay(1500); 

    // --- SECURE RETRIEVAL LOGIC (Filter BEFORE Search) ---
    // PDF Page 4: Pre-filtering
    
    // 1. Get User's effective roles (Global + Delegated)
    const effectiveRoles = permissionService.getUserActiveRoles(user);

    // 2. Filter Chunks
    const accessibleChunks = MOCK_KB_CHUNKS.filter(chunk => {
      // A. Public check
      if (chunk.meta_is_public) return true;

      // B. Dept Check
      if (chunk.meta_allowed_dept_ids.includes(user.department.id)) return true;

      // C. Role Check (Intersection with effective roles)
      const hasRole = chunk.meta_allowed_roles.some(r => effectiveRoles.includes(r));
      if (hasRole) return true;

      return false; // Access Denied
    });

    // 3. Keyword Search on Accessible Chunks only
    const queryLower = query.toLowerCase();
    const relevantChunks = accessibleChunks.filter(chunk => 
      chunk.content_text.toLowerCase().includes(queryLower) ||
      MOCK_KB_DOCS.find(d => d.id === chunk.document_id)?.title.toLowerCase().includes(queryLower)
    ).slice(0, 3); 

    let responseContent = "";
    const citations: any[] = [];

    if (relevantChunks.length === 0) {
       responseContent = "抱歉，根據您的權限（包含代理職務），我在知識庫中找不到相關資訊。";
    } else {
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
