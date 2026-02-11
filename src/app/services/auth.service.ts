import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, catchError, take, tap, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { jwtDecode } from "jwt-decode";
import { user } from "../class/user";
import { Platform } from "@ionic/angular";
import { WebsocketService } from "./websocket.service";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  public userLogado: user = new user();

  //public userLogado: user = {cod_usuario : 1, nom_usuario: 'maxuel', cod_empresa_usuario: [], schema: 'zmaisz', cod_empresa_sel: []}

  public isAndroid = false;
  public isIOS = false;
  isMobile: boolean = false;

  private readonly baseURL = environment["endPoint"];

  constructor(
    private router: Router,
    public socket: WebsocketService,
    private httpClient: HttpClient,
    private platform: Platform,
  ) {}

  loginUser(nom_usuario: string, senha: string): Observable<any> {
    const token = window.localStorage.getItem("token");
    const body = { nom_usuario, senha };

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: `${token}`, // Adiciona o token no header 'Authorization'
      }),
    };
    return (
      this.httpClient
        .post<any>(`${this.baseURL}/login`, body)
        //httpOptions)
        .pipe(
          take(1),
          catchError((err) => {
            throw err;
          }),
        )
    );
  }

  checkPlatform() {
    if (this.platform.is("android")) {
      console.log("Está sendo executado em um dispositivo Android");
      this.isAndroid = true;
    } else if (this.platform.is("ios")) {
      console.log("Está sendo executado em um dispositivo iOS");
      this.isIOS = true;
    } else {
      console.log("Não está sendo executado em um dispositivo Android ou iOS");
      // Caso não esteja em nenhuma das plataformas desejadas
    }
  }

  // destroyToken() {
  //   this.socket.socketExitApp(this.userLogado.nom_usuario, 'trocaPreco');
  //   this.socket.socketDisconnect();
  //   setTimeout(() => {
  //     localStorage.removeItem('auth');
  //     localStorage.removeItem('token');
  //     this.router.navigate(['/login']);
  //     this.userLogado = {... new user()}
  //   }, 1000);

  // }

  destroyToken(): void {
    try {
      console.log("DestroyToken executado - Limpando sessão");

      // Limpa localStorage (mas preserva credenciais salvas)
      const keysToRemove = ["auth", "token", "userInfo"];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
        console.log(`Removido: ${key}`);
      });

      // Disconecta socket
      if (this.socket && this.userLogado.nom_usuario) {
        this.socket.socketExitApp(this.userLogado.nom_usuario, "trocaPreco");
        this.socket.socketDisconnect();
      }

      // Limpa dados em memória
      this.clearUserData();

      // Emite evento global de logout
      window.dispatchEvent(new CustomEvent("userLoggedOut"));
    } catch (error) {
      console.error("Erro no destroyToken:", error);
      // Fallback: limpeza total
      localStorage.clear();
    }
  }

  private clearUserData(): void {
    this.userLogado = { ...new user() };
    this.router.navigate(["/login"]);
  }

  getToken() {
    const acess = window.localStorage.getItem("token");
    return acess;
  }

  getAuthToken() {
    const token = window.localStorage.getItem("token");
    return token;
  }

  getAuthTokenExpireIn(token: string): Date {
    const decoded: any = jwtDecode(token);

    if (decoded.exp === undefined) {
      return null;
    }

    const date = new Date(0);
    date.setUTCSeconds(decoded.exp);
    return date;
  }

  isTokenExpired(token: string): boolean {
    if (!token) {
      //se nao tem token
      return true;
    }

    const date = this.getAuthTokenExpireIn(token);
    if (date === undefined) {
      // se nao tem data
      return false;
    }

    return !(date.valueOf() > new Date().valueOf()); // se tem data atual e a data do token for maior q a data atual = false
  }

  isLogged() {
    const token = this.getAuthToken();
    if (!token) {
      // se nao tem token
      return false;
    } else if (this.isTokenExpired(token)) {
      //se tem token, valido se esta expirado
      return false;
    }

    return true;
  }
}
