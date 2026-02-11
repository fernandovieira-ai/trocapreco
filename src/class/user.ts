
export class user{
  cod_usuario: number
  nom_usuario: string
  cod_empresa_usuario: empresa[]
  schema: string
  cod_empresa_sel: any[]
  des_rede: string
  img_rede: string
  ind_aprova_negociacao: string
  empresa: any[]
}

export class newUser{
  nom_usuario: string
  senha: number
  schema: string
  des_rede: string
  img_rede: string
  ind_aprova_negociacao: string
}

export class cod_empresa{
  cod_empresa: number
}

export class pessoa{
  cod_pessoa: number
  nom_pessoa: string
  num_cnpj_cpf: string
  cod_regiao_venda: number
  ind_selecionado: boolean
}

export class regiao{
  cod_regiao_venda: number
  des_regiao_venda: string
  ind_selecionado: boolean
}

export class item{
  cod_item: number
  des_item: string
  cod_barra: string
  cod_sub_grupo: number
  ind_selecionado: boolean
  val_preco_venda: number
  val_custo_medio: number
  cod_empresa: number
  nom_fantasia: string
  ind_selecionado_regra: boolean
}

export class itemBomba{
  cod_item: number
  des_item: string
  cod_barra: string
  cod_sub_grupo: number
  ind_selecionado: boolean
  val_preco_venda: number
  val_custo_medio: number
  cod_empresa: number
  nom_fantasia: string
  ind_selecionado_regra: boolean
  val_novo_preco_venda: number
}

export class itemfull{
  cod_item: number
  des_item: string
}

export class subGrupo{
  cod_sub_grupo: number
  des_subgrupo: string
}

export class formaPagto{
  cod_forma_pagto: number
  des_forma_pagto: string
  cod_empresa: number
  ind_selecionado: boolean
  ind_tipo: string
  ind_selecionado_todos: boolean
}

export class pessoaNegociacao{
cod_item: number
des_item: string
dta_inicio: string
val_preco_venda_a: number
val_preco_venda_b: number
val_preco_venda_c: number
val_preco_venda_d: number
val_preco_venda_e: number
val_custo_medio: number
cod_pessoa: number
cod_condicao_pagamento: number
des_forma_pagto: string
dta_inclusao: string
ind_tipo_negociacao: string
ind_percentual_valor: string
ind_tipo_preco_base: string
nom_pessoa: string
ind_adicionado: boolean
val_preco_venda: number
valor_calculado: number
valor_valido: boolean
valor: number
nom_fantasia: string
cod_empresa: number
}

export class tipoPreco{
  tipo: string
}

export class empresa{
  cod_empresa: number
  nom_fantasia: string
  ind_selecionado: boolean
}

export class minhasNegociacoes{
  dta_inclusao: string
  seq_lote_alteracao: number
  total_registros: number
  nom_fantasia: string
  cod_empresa: number
  ind_excluido: string
  progresso: number
  total: number
  error: string
  des_observacao:string
  ind_status: string
}

export class minhasNegociacoesDetalhe{
  seq_lote_alteracao: number
  cod_condicao_pagamento: number
  des_forma_pagto: string
  cod_item: number
  des_item: string
  cod_pessoa: number
  nom_pessoa: string
  dta_inclusao: string
  ind_percentual_valor: string
  ind_tipo_negociacao: string
  ind_tipo_preco_base: string
  val_preco_venda_a: number
  val_preco_venda_b: number
  val_preco_venda_c: number
  val_preco_venda_d: number
  val_preco_venda_e: number
  ind_excluido: string
  ind_status: string
  val_custo_medio: number
  val_preco_venda: number
}


export class negociacoesExistentes{
  seq_lote_alteracao: number
  cod_condicao_pagamento: number
  des_forma_pagto: string
  cod_item: number
  des_item: string
  cod_pessoa: number
  nom_pessoa: string
  dta_inclusao: string
  dta_inicio: string
  ind_percentual_valor: string
  ind_tipo_negociacao: string
  ind_tipo_preco_base: string
  val_preco_venda_a: number
  val_preco_venda_b: number
  val_preco_venda_c: number
  val_preco_venda_d: number
  val_preco_venda_e: number
  new_val_preco_venda_a: number = 0
  new_val_preco_venda_b: number = 0
  new_val_preco_venda_c: number = 0
  new_val_preco_venda_d: number = 0
  new_val_preco_venda_e: number = 0
  ind_alterado: boolean
}
