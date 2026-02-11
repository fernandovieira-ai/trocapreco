import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, catchError, take, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { formaPagto, item, pessoa, regiao } from "../class/user";

@Injectable({
  providedIn: "root",
})
export class MovimentoService {
  private readonly baseURL = environment["endPoint"];
  private token = "5808|6xfqY9lk1lQRljSoWsfliv95FWxNT0Hp";

  private _pessoasSelecionadas: pessoa[] = []; // pessoas adicionadas do filtro cliente

  // Getter/setter para rastrear modificações
  get pessoasSelecionadas(): pessoa[] {
    return this._pessoasSelecionadas;
  }

  set pessoasSelecionadas(value: pessoa[]) {
    console.log("✏️ SET pessoasSelecionadas:", value?.length || 0, "items");
    console.trace("Stack trace:");
    this._pessoasSelecionadas = value;
  }

  public regiaoSelecionada: regiao[] = [];
  public itemSelecionado: item[] = [];
  public formaPagto: formaPagto[] = [];
  public tipoFormaPagto: formaPagto[] = [];

  constructor(private httpClient: HttpClient) {}

  buscaEmpresasBase(schema, empresa): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema, empresa };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/buscaEmpresasBase`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  buscaFiltro(schema, cod_empresa): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema, cod_empresa };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/buscaFiltro`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  buscaFiltroPreLoad(schema): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/buscaFiltroPreLoad`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  buscaItemBomba(schema, cod_empresa): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema, cod_empresa };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/buscaItemBomba`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  buscaFiltroItem(schema, cod_empresa): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema, cod_empresa };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/buscaFiltroItem`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  buscaPrecosCliente(schema, cod_empresa, cliente): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema, cod_empresa, cliente };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/buscaPrecosCliente`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  novaNegociacao(
    schema,
    cod_empresa,
    nom_usuario,
    cod_usuario,
    cliente,
    itens,
  ): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = {
      schema,
      cod_empresa,
      nom_usuario,
      cod_usuario,
      cliente,
      itens,
    };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/novaNegociacao`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  atualizaNegociacao(
    schema,
    cod_empresa,
    nom_usuario,
    cod_usuario,
    itens,
  ): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema, cod_empresa, nom_usuario, cod_usuario, itens };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/atualizaNegociacao`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  buscaMinhasNegociacoes(schema, cod_usuario, cod_empresa): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema, cod_usuario, cod_empresa };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/buscaMinhasNegociacoes`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  buscaMinhasNegociacoesDetalhe(
    schema,
    cod_usuario,
    cod_empresa,
    seq_lote_alteracao,
    ind_aprovacao,
  ): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = {
      schema,
      cod_usuario,
      cod_empresa,
      seq_lote_alteracao,
      ind_aprovacao,
    };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/buscaMinhasNegociacoesDetalhe`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  buscaNegociacoesEmpresa(schema, cod_empresa): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema, cod_empresa };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/buscaNegociacoesEmpresa`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  buscaAtualizacaoNegociacao(
    schema,
    cod_usuario,
    cod_empresa,
    item,
    formaPagto,
    pessoa,
  ): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema, cod_usuario, cod_empresa, item, formaPagto, pessoa };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/buscaAtualizacaoNegociacao`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  excluirNegociacao(
    schema,
    cod_usuario,
    cod_empresa,
    seq_lote,
  ): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema, cod_usuario, cod_empresa, seq_lote };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/excluirNegociacao`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  enviaTrocaPreco(
    schema,
    cod_usuario,
    nom_usuario,
    empresas,
    item,
  ): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema, cod_usuario, nom_usuario, empresas, item };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/enviaTrocaPreco`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  aprovaRegra(schema, cod_empresa, nom_usuario, seq_lote): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema, cod_empresa, nom_usuario, seq_lote };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/aprovaRegra`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  reprovaRegra(schema, seq_lote): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema, seq_lote };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`,
      }),
    };
    return this.httpClient.post<any>(`${this.baseURL}/reprovaRegra`, body).pipe(
      take(1),
      catchError((err) => {
        throw err;
      }),
    );
  }

  alterarSenha(cod_usuario, senha): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { cod_usuario, senha };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/alterarSenha`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  novoUsuario(
    nom_usuario,
    senha,
    schema_base,
    des_rede,
    img_rede,
    ind_aprova_negociacao,
  ): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = {
      nom_usuario,
      senha,
      schema_base,
      des_rede,
      img_rede,
      ind_aprova_negociacao,
    };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/novoUsuario`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  removeUsuario(cod_usuario, schema_base): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { cod_usuario, schema_base };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/removeUsuario`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  updateUsuario(cod_usuario, schema_base, status): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { cod_usuario, schema_base, status };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/updateUsuario`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  sincronizaCadastros(
    schema_base,
    param1 = 1,
    param2 = "S",
    param3 = 0,
    param4 = "R",
  ): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema_base, param1, param2, param3, param4 };

    console.log("===== MovimentoService.sincronizaCadastros =====");
    console.log("URL completa:", `${this.baseURL}/sincronizaCadastros`);
    console.log("Método:", "POST");
    console.log("---");
    console.log("Body enviado:");
    console.log(JSON.stringify(body, null, 2));
    console.log("---");
    console.log("Headers:");
    console.log("  Content-Type: application/json");
    console.log(
      "  Authorization:",
      token ? "Token presente ✓" : "Token ausente ✗",
    );
    console.log("---");
    console.log("Tipos dos parâmetros:");
    console.log("  schema_base:", typeof schema_base, "=", schema_base);
    console.log("  param1:", typeof param1, "=", param1);
    console.log("  param2:", typeof param2, "=", param2);
    console.log("  param3:", typeof param3, "=", param3);
    console.log("  param4:", typeof param4, "=", param4);
    console.log("===== Enviando requisição HTTP =====");

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/sincronizaCadastros`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            console.error(
              "===== ERRO HTTP na requisição sincronizaCadastros =====",
            );
            console.error("Status:", err.status);
            console.error("Status Text:", err.statusText);
            console.error("URL:", err.url);
            console.error("Erro completo:", err);
            throw err;
          }),
        )
    );
  }

  atualizaUsuarios(schema_base): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema_base };

    console.log(
      "MovimentoService.atualizaUsuarios - Enviando para backend:",
      body,
    );
    console.log("URL:", `${this.baseURL}/atualizaUsuarios`);

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`,
      }),
    };

    return this.httpClient
      .post<any>(`${this.baseURL}/atualizaUsuarios`, body)
      .pipe(
        take(1),
        catchError((err) => {
          console.error("Erro na requisição atualizaUsuarios:", err);
          throw err;
        }),
      );
  }

  buscaUsuario(schema_base): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema_base };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/buscaUsuario`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  buscaPrecoIntervalo(
    schema,
    cod_empresa,
    precoInicial,
    precoFinal,
  ): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { schema, cod_empresa, precoInicial, precoFinal };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/buscaPrecoIntervalo`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }
}
