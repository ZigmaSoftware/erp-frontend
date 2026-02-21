/* ===========================================================
   CORE BASE TYPES
=========================================================== */
export interface BaseEntity {
  unique_id: string;
  is_active: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}



export interface UserCreation{
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  
}

/* ===========================================================
   USER TYPES (HR ROLE DEFINITION)
=========================================================== */
export interface UserType extends BaseEntity {
  id: string;
  name: string;
}

