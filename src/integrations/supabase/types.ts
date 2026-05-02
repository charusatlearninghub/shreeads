export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      affiliate_sales: {
        Row: {
          affiliate_id: string
          commission_amount: number
          commission_percent: number
          created_at: string
          id: string
          package_id: string
          package_purchase_id: string | null
          paid_at: string | null
          sale_amount: number
          status: Database["public"]["Enums"]["affiliate_sale_status"]
          user_id: string
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number
          commission_percent?: number
          created_at?: string
          id?: string
          package_id: string
          package_purchase_id?: string | null
          paid_at?: string | null
          sale_amount?: number
          status?: Database["public"]["Enums"]["affiliate_sale_status"]
          user_id: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          commission_percent?: number
          created_at?: string
          id?: string
          package_id?: string
          package_purchase_id?: string | null
          paid_at?: string | null
          sale_amount?: number
          status?: Database["public"]["Enums"]["affiliate_sale_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_sales_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_sales_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_sales_package_purchase_id_fkey"
            columns: ["package_purchase_id"]
            isOneToOne: false
            referencedRelation: "package_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          applied_at: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          paid_earnings: number
          pending_earnings: number
          referral_code: string
          status: Database["public"]["Enums"]["affiliate_status"]
          total_earnings: number
          total_sales: number
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          paid_earnings?: number
          pending_earnings?: number
          referral_code: string
          status?: Database["public"]["Enums"]["affiliate_status"]
          total_earnings?: number
          total_sales?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          paid_earnings?: number
          pending_earnings?: number
          referral_code?: string
          status?: Database["public"]["Enums"]["affiliate_status"]
          total_earnings?: number
          total_sales?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      certificate_fonts: {
        Row: {
          created_at: string
          created_by: string | null
          font_url: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          font_url: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          font_url?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string | null
          field_positions: Json
          id: string
          is_active: boolean
          organization_name: string
          template_url: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          field_positions?: Json
          id?: string
          is_active?: boolean
          organization_name?: string
          template_url: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          field_positions?: Json
          id?: string
          is_active?: boolean
          organization_name?: string
          template_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          course_id: string
          created_at: string
          id: string
          issued_at: string
          pdf_url: string | null
          user_id: string
        }
        Insert: {
          certificate_number: string
          course_id: string
          created_at?: string
          id?: string
          issued_at?: string
          pdf_url?: string | null
          user_id: string
        }
        Update: {
          certificate_number?: string
          course_id?: string
          created_at?: string
          id?: string
          issued_at?: string
          pdf_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          discount_price: number | null
          id: string
          is_free: boolean | null
          is_published: boolean | null
          price: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          discount_price?: number | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          price?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          discount_price?: number | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          price?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      device_registrations: {
        Row: {
          device_fingerprint: string
          device_name: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          registered_at: string
          user_id: string
        }
        Insert: {
          device_fingerprint: string
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          registered_at?: string
          user_id: string
        }
        Update: {
          device_fingerprint?: string
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          registered_at?: string
          user_id?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string
          course_name: string | null
          enrolled_at: string
          final_price_paid: number | null
          id: string
          original_price: number | null
          payment_type: string | null
          promo_code: string | null
          promo_code_id: string | null
          promo_price: number | null
          user_id: string
        }
        Insert: {
          course_id: string
          course_name?: string | null
          enrolled_at?: string
          final_price_paid?: number | null
          id?: string
          original_price?: number | null
          payment_type?: string | null
          promo_code?: string | null
          promo_code_id?: string | null
          promo_price?: number | null
          user_id: string
        }
        Update: {
          course_id?: string
          course_name?: string | null
          enrolled_at?: string
          final_price_paid?: number | null
          id?: string
          original_price?: number | null
          payment_type?: string | null
          promo_code?: string | null
          promo_code_id?: string | null
          promo_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean | null
          last_watched_at: string | null
          lesson_id: string
          updated_at: string
          user_id: string
          watched_seconds: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          last_watched_at?: string | null
          lesson_id: string
          updated_at?: string
          user_id: string
          watched_seconds?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          last_watched_at?: string | null
          lesson_id?: string
          updated_at?: string
          user_id?: string
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_preview: boolean | null
          order_index: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_preview?: boolean | null
          order_index?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_preview?: boolean | null
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      master_referral_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          label: string | null
          max_uses: number | null
          use_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number | null
          use_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number | null
          use_count?: number
        }
        Relationships: []
      }
      package_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: Database["public"]["Enums"]["package_item_type"]
          package_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: Database["public"]["Enums"]["package_item_type"]
          package_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["package_item_type"]
          package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_used: boolean
          package_id: string
          promo_price: number
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean
          package_id: string
          promo_price?: number
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean
          package_id?: string
          promo_price?: number
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_promo_codes_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_purchases: {
        Row: {
          affiliate_id: string | null
          amount_paid: number
          id: string
          original_price: number
          package_id: string
          promo_code: string | null
          promo_code_id: string | null
          purchased_at: string
          user_id: string
        }
        Insert: {
          affiliate_id?: string | null
          amount_paid?: number
          id?: string
          original_price?: number
          package_id: string
          promo_code?: string | null
          promo_code_id?: string | null
          purchased_at?: string
          user_id: string
        }
        Update: {
          affiliate_id?: string | null
          amount_paid?: number
          id?: string
          original_price?: number
          package_id?: string
          promo_code?: string | null
          promo_code_id?: string | null
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_purchases_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "package_promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          affiliate_commission_percent: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          original_price: number
          price: number
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          affiliate_commission_percent?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          original_price?: number
          price?: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_commission_percent?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          original_price?: number
          price?: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      price_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          course_id: string
          id: string
          new_discount_price: number | null
          new_is_free: boolean | null
          new_price: number | null
          old_discount_price: number | null
          old_is_free: boolean | null
          old_price: number | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          course_id: string
          id?: string
          new_discount_price?: number | null
          new_is_free?: boolean | null
          new_price?: number | null
          old_discount_price?: number | null
          old_is_free?: boolean | null
          old_price?: number | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          course_id?: string
          id?: string
          new_discount_price?: number | null
          new_is_free?: boolean | null
          new_price?: number | null
          old_discount_price?: number | null
          old_is_free?: boolean | null
          old_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          referral_code_used: string | null
          sponsor_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          referral_code_used?: string | null
          sponsor_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code_used?: string | null
          sponsor_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          course_id: string | null
          course_name: string | null
          created_at: string | null
          final_price_paid: number | null
          id: string
          original_price_at_purchase: number | null
          paid_amount: number | null
          promo_code: string
          promo_code_id: string
          promo_price: number | null
          used_at: string | null
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          course_id?: string | null
          course_name?: string | null
          created_at?: string | null
          final_price_paid?: number | null
          id?: string
          original_price_at_purchase?: number | null
          paid_amount?: number | null
          promo_code: string
          promo_code_id: string
          promo_price?: number | null
          used_at?: string | null
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          course_id?: string | null
          course_name?: string | null
          created_at?: string | null
          final_price_paid?: number | null
          id?: string
          original_price_at_purchase?: number | null
          paid_amount?: number | null
          promo_code?: string
          promo_code_id?: string
          promo_price?: number | null
          used_at?: string | null
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          course_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_used: boolean | null
          promo_price: number | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          course_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          promo_price?: number | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          course_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          promo_price?: number | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          promotion_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          promotion_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_courses_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_software: {
        Row: {
          created_at: string
          id: string
          product_id: string
          promotion_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          promotion_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_software_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "software_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_software_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          discount_percentage: number
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_percentage: number
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_percentage?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          total_referrals: number | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          total_referrals?: number | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          total_referrals?: number | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          rating: number
          review_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          rating: number
          review_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          rating?: number
          review_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          incident_type: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          incident_type: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      signup_attempts: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          email: string | null
          id: string
          ip_address: string | null
          reason: string | null
          referral_code: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          referral_code?: string | null
          success?: boolean
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          referral_code?: string | null
          success?: boolean
        }
        Relationships: []
      }
      software_downloads: {
        Row: {
          downloaded_at: string
          id: string
          ip_address: string | null
          purchase_id: string
          user_agent: string | null
          user_id: string
          version_id: string
        }
        Insert: {
          downloaded_at?: string
          id?: string
          ip_address?: string | null
          purchase_id: string
          user_agent?: string | null
          user_id: string
          version_id: string
        }
        Update: {
          downloaded_at?: string
          id?: string
          ip_address?: string | null
          purchase_id?: string
          user_agent?: string | null
          user_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "software_downloads_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "software_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "software_downloads_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "software_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      software_products: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          discount_price: number | null
          id: string
          is_free: boolean | null
          is_published: boolean | null
          price: number | null
          short_description: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_price?: number | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          price?: number | null
          short_description?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_price?: number | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          price?: number | null
          short_description?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      software_promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_used: boolean | null
          product_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          product_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          product_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "software_promo_codes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "software_products"
            referencedColumns: ["id"]
          },
        ]
      }
      software_purchases: {
        Row: {
          amount_paid: number | null
          id: string
          payment_method: string | null
          product_id: string
          promo_code_id: string | null
          purchased_at: string
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          id?: string
          payment_method?: string | null
          product_id: string
          promo_code_id?: string | null
          purchased_at?: string
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          id?: string
          payment_method?: string | null
          product_id?: string
          promo_code_id?: string | null
          purchased_at?: string
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "software_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "software_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "software_purchases_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      software_versions: {
        Row: {
          created_at: string
          file_size_bytes: number | null
          file_type: Database["public"]["Enums"]["software_file_type"]
          file_url: string
          id: string
          is_latest: boolean | null
          platform: Database["public"]["Enums"]["software_platform"]
          product_id: string
          release_notes: string | null
          version_number: string
        }
        Insert: {
          created_at?: string
          file_size_bytes?: number | null
          file_type: Database["public"]["Enums"]["software_file_type"]
          file_url: string
          id?: string
          is_latest?: boolean | null
          platform: Database["public"]["Enums"]["software_platform"]
          product_id: string
          release_notes?: string | null
          version_number: string
        }
        Update: {
          created_at?: string
          file_size_bytes?: number | null
          file_type?: Database["public"]["Enums"]["software_file_type"]
          file_url?: string
          id?: string
          is_latest?: boolean | null
          platform?: Database["public"]["Enums"]["software_platform"]
          product_id?: string
          release_notes?: string | null
          version_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "software_versions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "software_products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: string
          push_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          push_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          push_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      youtube_videos: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean
          order_index: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_id: string
          youtube_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_id: string
          youtube_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_id?: string
          youtube_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_as_affiliate: {
        Args: never
        Returns: {
          applied_at: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          paid_earnings: number
          pending_earnings: number
          referral_code: string
          status: Database["public"]["Enums"]["affiliate_status"]
          total_earnings: number
          total_sales: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "affiliates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cleanup_old_software_downloads: { Args: never; Returns: number }
      cleanup_old_software_downloads_scheduled: { Args: never; Returns: number }
      generate_certificate_number: { Args: never; Returns: string }
      get_active_promotion_for_course: {
        Args: { _course_id: string }
        Returns: {
          discount_percentage: number
          end_date: string
          promotion_id: string
          promotion_name: string
        }[]
      }
      get_active_promotion_for_software: {
        Args: { _product_id: string }
        Returns: {
          discount_percentage: number
          end_date: string
          promotion_id: string
          promotion_name: string
        }[]
      }
      get_affiliate_by_code: { Args: { _code: string }; Returns: string }
      get_affiliate_network_stats: { Args: never; Returns: Json }
      get_my_sponsor: { Args: never; Returns: Json }
      get_top_sponsors: {
        Args: { _limit?: number }
        Returns: {
          referral_count: number
          sponsor_email: string
          sponsor_id: string
          sponsor_name: string
        }[]
      }
      has_completed_course: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      has_purchased_software: {
        Args: { _product_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_enrolled: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      is_lesson_accessible: {
        Args: { _lesson_id: string; _user_id: string }
        Returns: boolean
      }
      mark_affiliate_sale_paid: {
        Args: { _sale_id: string }
        Returns: undefined
      }
      redeem_package_promo: {
        Args: { _code: string; _referral_code?: string }
        Returns: Json
      }
      validate_referral_code: { Args: { _code: string }; Returns: Json }
    }
    Enums: {
      affiliate_sale_status: "pending" | "paid" | "rejected"
      affiliate_status: "pending" | "approved" | "rejected"
      app_role: "admin" | "student"
      package_item_type: "course" | "software"
      software_file_type:
        | "apk"
        | "exe"
        | "msi"
        | "dmg"
        | "pkg"
        | "appimage"
        | "deb"
        | "rpm"
      software_platform: "android" | "windows" | "mac" | "linux"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      affiliate_sale_status: ["pending", "paid", "rejected"],
      affiliate_status: ["pending", "approved", "rejected"],
      app_role: ["admin", "student"],
      package_item_type: ["course", "software"],
      software_file_type: [
        "apk",
        "exe",
        "msi",
        "dmg",
        "pkg",
        "appimage",
        "deb",
        "rpm",
      ],
      software_platform: ["android", "windows", "mac", "linux"],
    },
  },
} as const
