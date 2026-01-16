declare module './knowledge-embeddings.json' {
  interface KnowledgeChunk {
    id: string;
    text: string;
    metadata: { 
      type: 'project' | 'experience' | 'skill' | 'education' | 'personal'; 
      title?: string;
      tags?: string[];
    };
    embedding: number[];
  }
  const value: KnowledgeChunk[];
  export default value;
}