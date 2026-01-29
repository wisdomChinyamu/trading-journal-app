export interface NotePage {
  pageId: string;
  ownerId: string;
  parentPageId?: string | null;
  title: string;
  icon?: string | null;
  cover?: string | null;
  order: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteBlock {
  blockId: string;
  pageId: string;
  parentId: string;
  type: string;
  properties: Record<string, any>;
  order: number;
  depth: number;
  isCollapsed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
