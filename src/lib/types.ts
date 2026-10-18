export type Side = 'bride' | 'groom' | 'both';
export type Wish = {
  id: string;
  created_at: string;
  guest_name: string;
  side: Side | null;
  message: string;
  image_file_id: string | null;
  is_hidden: boolean;
  is_pinned: boolean;
};
export type WishInput = Pick<Wish, 'guest_name' | 'side' | 'message' | 'image_file_id'>;
export type ControlEvent = 'hide' | 'unhide' | 'pin' | 'delete';
export type ConnectionStatus = 'connecting' | 'connected' | 'offline' | 'unconfigured';
export const sideLabels: Record<Side, string> = { bride: 'ฝ่ายเจ้าสาว', groom: 'ฝ่ายเจ้าบ่าว', both: 'ทั้งสองฝ่าย' };
export type Database = {
  public: {
    Tables: {
      wishes: { Row: Wish; Insert: WishInput & Partial<Pick<Wish, 'id' | 'created_at' | 'is_hidden' | 'is_pinned'>>; Update: Partial<Wish>; Relationships: [] };
      admins: { Row: { email: string }; Insert: { email: string }; Update: { email?: string }; Relationships: [] };
      wedding_settings: { Row: { id: number; wedding_date: string | null }; Insert: { id?: number; wedding_date?: string | null }; Update: { wedding_date?: string | null }; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: { is_admin: { Args: Record<string, never>; Returns: boolean } };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
