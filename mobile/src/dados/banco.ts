
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "alunos": {
                  Row: {
                    "agendada": Json | null,"arquivado": boolean,"atrasos_historicos": number,"criado_em": string,"dia": string,"disciplina": string,"disponibilidade": Json | null,"email": string | null,"encerrado": string | null,"hora": string,"id": string,"lembretes": number,"nome": string,"pagamento_em": string | null,"pagamento_meio": string | null,"pagamento_status": Database["public"]['Enums']["status_pagamento"],"pagamento_vencimento": string | null,"pausado": boolean,"pendencia_origem": string | null,"professor_id": string,"reposicoes": number,"sem_pacote": boolean,"telefone": string | null,"token_publico": string,"total": number,"ultimo_lembrete": string | null,"usadas": number,"validade": string | null,"validade_estendida": boolean,"valor_por_aula_centavos": number | null,"versao": number
                  }
                  ComputedFields: never
                  Insert: {
                    "agendada"?: Json | null,"arquivado"?: boolean,"atrasos_historicos"?: number,"criado_em"?: string,"dia": string,"disciplina": string,"disponibilidade"?: Json | null,"email"?: string | null,"encerrado"?: string | null,"hora": string,"id"?: string,"lembretes"?: number,"nome": string,"pagamento_em"?: string | null,"pagamento_meio"?: string | null,"pagamento_status"?: Database["public"]['Enums']["status_pagamento"],"pagamento_vencimento"?: string | null,"pausado"?: boolean,"pendencia_origem"?: string | null,"professor_id"?: string,"reposicoes"?: number,"sem_pacote"?: boolean,"telefone"?: string | null,"token_publico"?: string,"total"?: number,"ultimo_lembrete"?: string | null,"usadas"?: number,"validade"?: string | null,"validade_estendida"?: boolean,"valor_por_aula_centavos"?: number | null,"versao"?: number
                  }
                  Update: {
                    "agendada"?: Json | null,"arquivado"?: boolean,"atrasos_historicos"?: number,"criado_em"?: string,"dia"?: string,"disciplina"?: string,"disponibilidade"?: Json | null,"email"?: string | null,"encerrado"?: string | null,"hora"?: string,"id"?: string,"lembretes"?: number,"nome"?: string,"pagamento_em"?: string | null,"pagamento_meio"?: string | null,"pagamento_status"?: Database["public"]['Enums']["status_pagamento"],"pagamento_vencimento"?: string | null,"pausado"?: boolean,"pendencia_origem"?: string | null,"professor_id"?: string,"reposicoes"?: number,"sem_pacote"?: boolean,"telefone"?: string | null,"token_publico"?: string,"total"?: number,"ultimo_lembrete"?: string | null,"usadas"?: number,"validade"?: string | null,"validade_estendida"?: boolean,"valor_por_aula_centavos"?: number | null,"versao"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "alunos_professor_id_fkey"
      columns: ["professor_id"]
isOneToOne: false
      referencedRelation: "professores"
      referencedColumns: ["id"]
    }
                  ]
                },"disponibilidades": {
                  Row: {
                    "aceita_fora_dos_blocos": boolean,"blocos": NonNullable<Json>,"folgas": NonNullable<Json>,"professor_id": string,"sugere_sabado": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "aceita_fora_dos_blocos"?: boolean,"blocos"?: NonNullable<Json>,"folgas"?: NonNullable<Json>,"professor_id": string,"sugere_sabado"?: boolean
                  }
                  Update: {
                    "aceita_fora_dos_blocos"?: boolean,"blocos"?: NonNullable<Json>,"folgas"?: NonNullable<Json>,"professor_id"?: string,"sugere_sabado"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "disponibilidades_professor_id_fkey"
      columns: ["professor_id"]
isOneToOne: true
      referencedRelation: "professores"
      referencedColumns: ["id"]
    }
                  ]
                },"lancamentos": {
                  Row: {
                    "aluno_id": string,"criado_em": string,"data": string,"delta": number,"dinheiro": boolean,"id": string,"professor_id": string,"saldo_depois": number,"subtitulo": string,"tipo": Database["public"]['Enums']["tipo_lancamento"],"titulo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aluno_id": string,"criado_em"?: string,"data": string,"delta": number,"dinheiro"?: boolean,"id"?: string,"professor_id": string,"saldo_depois": number,"subtitulo"?: string,"tipo": Database["public"]['Enums']["tipo_lancamento"],"titulo": string
                  }
                  Update: {
                    "aluno_id"?: string,"criado_em"?: string,"data"?: string,"delta"?: number,"dinheiro"?: boolean,"id"?: string,"professor_id"?: string,"saldo_depois"?: number,"subtitulo"?: string,"tipo"?: Database["public"]['Enums']["tipo_lancamento"],"titulo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lancamentos_aluno_id_fkey"
      columns: ["aluno_id"]
isOneToOne: false
      referencedRelation: "alunos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lancamentos_professor_id_fkey"
      columns: ["professor_id"]
isOneToOne: false
      referencedRelation: "professores"
      referencedColumns: ["id"]
    }
                  ]
                },"politicas": {
                  Row: {
                    "avisada_devolve": boolean,"aviso_horas": number,"limite_reposicoes": number,"professor_id": string,"validade_dias": number
                  }
                  ComputedFields: never
                  Insert: {
                    "avisada_devolve"?: boolean,"aviso_horas"?: number,"limite_reposicoes"?: number,"professor_id": string,"validade_dias"?: number
                  }
                  Update: {
                    "avisada_devolve"?: boolean,"aviso_horas"?: number,"limite_reposicoes"?: number,"professor_id"?: string,"validade_dias"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "politicas_professor_id_fkey"
      columns: ["professor_id"]
isOneToOne: true
      referencedRelation: "professores"
      referencedColumns: ["id"]
    }
                  ]
                },"professores": {
                  Row: {
                    "chave_pix": string | null,"criado_em": string,"disciplinas": (string)[],"email": string,"faixa_de_alunos": Database["public"]['Enums']["faixa_de_alunos"] | null,"id": string,"iniciais": string,"nome": string,"pacote_padrao": Json | null,"plano": Database["public"]['Enums']["plano"],"preferencias_aviso": Json | null
                  }
                  ComputedFields: never
                  Insert: {
                    "chave_pix"?: string | null,"criado_em"?: string,"disciplinas"?: (string)[],"email": string,"faixa_de_alunos"?: Database["public"]['Enums']["faixa_de_alunos"] | null,"id": string,"iniciais"?: string,"nome"?: string,"pacote_padrao"?: Json | null,"plano"?: Database["public"]['Enums']["plano"],"preferencias_aviso"?: Json | null
                  }
                  Update: {
                    "chave_pix"?: string | null,"criado_em"?: string,"disciplinas"?: (string)[],"email"?: string,"faixa_de_alunos"?: Database["public"]['Enums']["faixa_de_alunos"] | null,"id"?: string,"iniciais"?: string,"nome"?: string,"pacote_padrao"?: Json | null,"plano"?: Database["public"]['Enums']["plano"],"preferencias_aviso"?: Json | null
                  }
                  Relationships: [
                    
                  ]
                },"propostas": {
                  Row: {
                    "alternativas": NonNullable<Json>,"aluno_id": string,"enviada_em": string,"id": string,"janela": NonNullable<Json>,"professor_id": string,"respondida_em": string | null,"status": Database["public"]['Enums']["status_proposta"]
                  }
                  ComputedFields: never
                  Insert: {
                    "alternativas"?: NonNullable<Json>,"aluno_id": string,"enviada_em": string,"id"?: string,"janela": NonNullable<Json>,"professor_id": string,"respondida_em"?: string | null,"status"?: Database["public"]['Enums']["status_proposta"]
                  }
                  Update: {
                    "alternativas"?: NonNullable<Json>,"aluno_id"?: string,"enviada_em"?: string,"id"?: string,"janela"?: NonNullable<Json>,"professor_id"?: string,"respondida_em"?: string | null,"status"?: Database["public"]['Enums']["status_proposta"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "propostas_aluno_id_fkey"
      columns: ["aluno_id"]
isOneToOne: false
      referencedRelation: "alunos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "propostas_professor_id_fkey"
      columns: ["professor_id"]
isOneToOne: false
      referencedRelation: "professores"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "faixa_de_alunos": "1–5"|"6–15"|"16+","plano": "gratuito"|"pago","status_pagamento": "pago"|"aberto"|"atraso"|"sem","status_proposta": "enviada"|"aceita"|"recusada"|"confirmadaPeloProfessor","tipo_lancamento": "aula"|"falta_avisada"|"falta_sem_aviso"|"cancelada_professor"|"reposicao"|"pagamento"|"pacote"|"validade"|"proposta"|"legado"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "faixa_de_alunos": ["1–5", "6–15", "16+"],"plano": ["gratuito", "pago"],"status_pagamento": ["pago", "aberto", "atraso", "sem"],"status_proposta": ["enviada", "aceita", "recusada", "confirmadaPeloProfessor"],"tipo_lancamento": ["aula", "falta_avisada", "falta_sem_aviso", "cancelada_professor", "reposicao", "pagamento", "pacote", "validade", "proposta", "legado"]
          }
        }
} as const
