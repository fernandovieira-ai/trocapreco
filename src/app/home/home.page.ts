import { Component, OnInit, ViewChild } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { MovimentoService } from "../services/movimento.service";
import { IonModal, LoadingController, Platform } from "@ionic/angular";
import { Alert } from "../class/alert";
import { catchError, finalize, tap, timeout } from "rxjs";
import { empresa, newUser, user } from "../class/user";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { WebsocketService } from "../services/websocket.service";
import { DataloadService } from "../services/dataload.service";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
  standalone: false,
})
export class HomePage implements OnInit {
  @ViewChild(IonModal) modal: IonModal;

  isModalOpenUser = false;
  isSyncInProgress = false;

  public novoUsuario: newUser = new newUser();
  public listaDeUsuarios: user[] = [];

  public empresas: empresa[] = [];
  public empresasFiltradas: empresa[] = [];
  public empresaSel = "Selecione";

  constructor(
    public auth: AuthService,
    public socket: WebsocketService,
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private loadingCtrl: LoadingController,
    private movimento: MovimentoService,
    private alert: Alert,
    public dataLoad: DataloadService,
  ) {}

  ngOnInit() {
    //this.route.queryParams.subscribe(params => {
    //console.log(params);
    //const schema = params['schema'];

    // Oculta os parâmetros da URL
    this.location.replaceState(
      this.router.createUrlTree([], { relativeTo: this.route }).toString(),
    );

    //this.showLoading('Buscando Empresas...', 50000);

    console.log(this.auth.userLogado);

    this.movimento
      .buscaEmpresasBase(
        this.auth.userLogado.schema,
        this.auth.userLogado.empresa,
      )
      .pipe(
        tap((data) => {
          this.empresas = data.message;
          this.empresasFiltradas = [...this.empresas];
        }),
        timeout(51000),
        catchError((err) => {
          this.loadingCtrl.dismiss().catch(() => {});
          this.handleError(err);
          throw err;
        }),
      )
      .subscribe(() => {
        this.loadingCtrl.dismiss().catch(() => {});
      });
    // });

    this.buscaFiltrosPreLoad();

    setTimeout(() => {
      this.socket.usuarioApp(this.auth.userLogado.nom_usuario, "trocaPreco");
    }, 3000);
  }

  buscaFiltrosPreLoad() {
    // Toast removido - badge visual indica status de carregamento

    const filtroObservable = this.movimento
      .buscaFiltroPreLoad(this.auth.userLogado.schema)
      .pipe(timeout(301000));

    filtroObservable
      .pipe(
        tap((data) => {
          this.dataLoad.pessoa = data.pessoa;
          this.dataLoad.regiao = data.regiao;
          this.dataLoad.subGrupo = data.subGrupo;
        }),
        finalize(() => (this.dataLoad.dadosCarregados = true)),
        catchError((error) => {
          this.handleError(error);
          throw error;
        }),
      )
      .subscribe();
  }

  alterarSenha() {
    this.alert.presentAlertPromptSenha().then((data) => {
      console.log(data[0]);
      if (data[0] === "" || data[0].length < 4) {
        this.alert.presentToast("Senha Inválida", 3000);
      } else {
        this.movimento
          .alterarSenha(this.auth.userLogado.cod_usuario, data[0])
          .pipe(
            tap((data) => {
              this.alert.presentToast(data.message, 3000);
            }),
            timeout(51000),
            catchError((err) => {
              this.handleError(err);
              throw err;
            }),
          )
          .subscribe(() => {});
      }
    });
  }

  pesquisaEmpresa(event) {
    const query = event.target.value.toLowerCase();
    this.empresasFiltradas = this.empresas.filter(
      (d) =>
        d.nom_fantasia.toLowerCase().indexOf(query) > -1 ||
        d.cod_empresa == query,
    );
  }

  selecaoEmpresa(ev, item) {
    //const seuEvento = { detail: { checked: true } }; // Simulando um evento

    const status = ev.detail.checked;

    if (status) {
      item.ind_selecionado = true;
      this.auth.userLogado.cod_empresa_usuario.push(item);
      this.auth.userLogado.cod_empresa_sel.push(item.cod_empresa);
    } else {
      this.removerItemPorCodEmpresa(
        this.auth.userLogado.cod_empresa_usuario,
        item.cod_empresa,
      );
      this.removerItemPorIndexEmpresa(
        this.auth.userLogado.cod_empresa_sel,
        item.cod_empresa,
      );
      item.ind_selecionado = false;
    }
  }

  marcarTodosItens() {
    this.auth.userLogado.cod_empresa_sel = [];
    this.auth.userLogado.cod_empresa_usuario = [];

    for (const row of this.empresasFiltradas) {
      row.ind_selecionado = true;
      this.auth.userLogado.cod_empresa_usuario.push(row);
      this.auth.userLogado.cod_empresa_sel.push(row.cod_empresa);
    }
  }

  desmarcarTodosItens() {
    for (const row of this.empresasFiltradas) {
      row.ind_selecionado = false;
    }
    this.auth.userLogado.cod_empresa_sel = [];
    this.auth.userLogado.cod_empresa_usuario = [];
  }

  removerItemPorCodEmpresa(array, codEmpresa) {
    // Encontra o índice do item com o código de empresa fornecido
    const index = array.findIndex((item) => item.cod_empresa == codEmpresa);

    // Se encontrar o item, remove-o do array
    if (index !== -1) {
      array.splice(index, 1);
      console.log(`Item com o código de empresa ${codEmpresa} removido.`);
    } else {
      console.log(`Item com o código de empresa ${codEmpresa} não encontrado.`);
    }
  }

  removerItemPorIndexEmpresa(array, codEmpresa) {
    // Encontra o índice do item com o código de empresa fornecido
    const index = array.findIndex((item) => item == codEmpresa);

    // Se encontrar o item, remove-o do array
    if (index !== -1) {
      array.splice(index, 1);
      console.log(`Item com o código de empresa ${codEmpresa} removido.`);
    } else {
      console.log(`Item com o código de empresa ${codEmpresa} não encontrado.`);
    }
  }

  criarCadastroUsuario() {
    const {
      nom_usuario,
      senha,
      schema,
      des_rede,
      img_rede,
      ind_aprova_negociacao,
    } = this.novoUsuario;

    if (senha.toString().length < 10) {
      this.movimento
        .novoUsuario(
          nom_usuario,
          senha,
          schema,
          des_rede,
          img_rede,
          ind_aprova_negociacao,
        )
        .pipe(
          tap((data) => {
            this.alert.presentToast(data.message, 3000);
            this.novoUsuario = new newUser();
          }),
          timeout(51000),
          catchError((err) => {
            this.handleError(err);
            throw err;
          }),
        )
        .subscribe(() => {
          this.buscaUsuarios();
        });
    }
  }

  removeUser(item) {
    this.movimento
      .removeUsuario(item.cod_usuario, this.auth.userLogado.schema)
      .pipe(
        tap((data) => {
          this.alert.presentToast(data.message, 3000);
          this.novoUsuario = new newUser();
        }),
        timeout(51000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      )
      .subscribe(() => {
        this.buscaUsuarios();
      });
  }

  buscaUsuarios() {
    this.movimento
      .buscaUsuario(this.auth.userLogado.schema)
      .pipe(
        tap((data) => {
          // Ordena: primeiro ind_aprova_negociacao='S', depois ordem alfabética
          this.listaDeUsuarios = data.message.sort((a: user, b: user) => {
            // Se um tem aprovação e outro não, o que tem aprovação vem primeiro
            if (
              a.ind_aprova_negociacao === "S" &&
              b.ind_aprova_negociacao !== "S"
            ) {
              return -1;
            }
            if (
              a.ind_aprova_negociacao !== "S" &&
              b.ind_aprova_negociacao === "S"
            ) {
              return 1;
            }
            // Se ambos têm ou ambos não têm aprovação, ordena por nome
            return a.nom_usuario.localeCompare(b.nom_usuario);
          });
        }),
        timeout(51000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      )
      .subscribe(() => {});
  }

  abrirUsuarios() {
    const schema = this.auth.userLogado.schema;

    console.log("Atualizando usuários do schema:", schema);

    // Abre o modal imediatamente
    this.setOpen(true);

    // Atualiza os usuários em background
    this.movimento.atualizaUsuarios(schema).subscribe({
      next: (data) => {
        console.log("Usuários atualizados com sucesso:", data);
        // Recarrega a lista após atualizar
        this.buscaUsuarios();
      },
      error: (err) => {
        console.error("Erro ao atualizar usuários:", err);
      },
    });
  }

  setOpen(isOpen: boolean) {
    this.isModalOpenUser = isOpen;
    this.novoUsuario.des_rede = this.auth.userLogado.des_rede;
    this.novoUsuario.img_rede = this.auth.userLogado.img_rede;
    this.novoUsuario.schema = this.auth.userLogado.schema;

    // Define o toggle baseado no usuário logado
    if (this.auth.userLogado.ind_aprova_negociacao === "S") {
      this.novoUsuario.ind_aprova_negociacao = "S";
      this.novoUsuario.ind_aprova_negociacao_bool = true;
    } else {
      this.novoUsuario.ind_aprova_negociacao = "N";
      this.novoUsuario.ind_aprova_negociacao_bool = false;
    }

    this.buscaUsuarios();
  }

  setAprovaNegociacao(ev) {
    const status = ev.detail.checked;
    if (status) {
      this.novoUsuario.ind_aprova_negociacao = "S";
    } else {
      this.novoUsuario.ind_aprova_negociacao = "N";
    }
  }

  //   atualizaRegistro() {

  //     this.alert.presentAlertConfirm('Confirma a sincronização dos cadastros?','Este processo pode levar um tempo', 'Deseja Continuar ?').then(data => {
  //       if (data) {
  //         this.sincronizaCadastros()
  //       }
  //     }
  //     )
  //   }

  //   sincronizaCadastros() {
  //   this.showLoading('Sincronizando cadastros...', 50000);

  //   this.movimento.sincronizaCadastros(this.auth.userLogado.schema).pipe(
  //     timeout(51000)
  //   ).subscribe({
  //     next: (data) => {
  //       // Sucesso → mostra mensagem
  //       this.alert.presentToast(data.message, 3000);
  //     },
  //     error: (err) => {
  //       // Erro → trata e mostra alerta
  //       this.handleError(err);
  //     },
  //     complete: () => {
  //       // Finalizou → fecha loading e desloga
  //       this.loadingCtrl.dismiss();
  //       this.logout();
  //     }
  //   });
  // }

  atualizaRegistro() {
    // Inicia sincronização diretamente sem confirmação
    this.executarSincronizacao();
  }

  executarSincronizacao() {
    console.log("===== INÍCIO SINCRONIZAÇÃO FRONTEND =====");
    console.log("Timestamp:", new Date().toISOString());

    this.isSyncInProgress = true;
    // Não mostra loading que bloqueia a tela
    // O botão já mostra o estado de sincronização

    const schema = this.auth.userLogado.schema;

    // Busca o código da empresa dinamicamente
    // Primeiro tenta pegar da primeira empresa carregada da tab_base
    // Se não tiver, usa o código da empresa do usuário logado
    let codEmpresa: number;

    console.log("Dados disponíveis para busca de empresa:");
    console.log("  - this.empresas.length:", this.empresas?.length || 0);
    console.log(
      "  - auth.userLogado.empresa.length:",
      this.auth.userLogado.empresa?.length || 0,
    );

    if (this.empresas && this.empresas.length > 0) {
      codEmpresa = this.empresas[0].cod_empresa;
      console.log(
        "✓ Usando código da primeira empresa da tab_base:",
        codEmpresa,
      );
      console.log("  Empresa completa:", this.empresas[0]);
    } else if (
      this.auth.userLogado.empresa &&
      this.auth.userLogado.empresa.length > 0
    ) {
      // auth.userLogado.empresa é um array, pega o primeiro elemento
      codEmpresa = this.auth.userLogado.empresa[0];
      console.log("✓ Usando código da empresa do usuário logado:", codEmpresa);
      console.log("  Array de empresas:", this.auth.userLogado.empresa);
    } else {
      console.error("✗ ERRO: Nenhuma empresa encontrada para sincronização");
      this.isSyncInProgress = false;
      this.alert.presentToast(
        "Erro: Nenhuma empresa encontrada para sincronização",
        3000,
      );
      return;
    }

    console.log("---");
    console.log("Schema a ser usado:", schema);
    console.log("Código da empresa (param1):", codEmpresa);
    console.log("---");
    console.log("Parâmetros completos da procedure:");
    console.log("  schema_base:", schema);
    console.log("  param1:", codEmpresa, "(cod_empresa)");
    console.log("  param2:", "S", "(Sincronizar)");
    console.log("  param3:", 0);
    console.log("  param4:", "R", "(Registro)");
    console.log("---");
    console.log("SQL esperado no backend:");
    console.log(`  SET search_path TO ${schema}, public;`);
    console.log(
      `  SELECT zmaisz.sp_atualiza_cadastro(${codEmpresa}, 'S', 0, 'R');`,
    );
    console.log("===== CHAMANDO SERVIÇO =====");

    this.movimento
      .sincronizaCadastros(schema, codEmpresa, "S", 0, "R")
      .pipe(
        timeout(560000),
        finalize(() => {
          // Garante que o estado seja resetado em qualquer caso
          console.log("Finalizando sincronização (finalize operator)");
          this.isSyncInProgress = false;
        }),
      )
      .subscribe({
        next: (data) => {
          console.log("===== RESPOSTA DO SERVIDOR RECEBIDA =====");
          console.log("Tipo de resposta:", typeof data);
          console.log("Resposta completa:", JSON.stringify(data, null, 2));
          if (data.message) console.log("Mensagem:", data.message);
          if (data.registros_atualizados)
            console.log("Registros atualizados:", data.registros_atualizados);
          if (data.success !== undefined)
            console.log("Status de sucesso:", data.success);
        },
        error: (err) => {
          console.error("===== ERRO NA SINCRONIZAÇÃO =====");
          console.error("Tipo de erro:", err.name);
          console.error("Status HTTP:", err.status);
          console.error("Mensagem:", err.message);
          console.error("Erro completo:", err);
          if (err.error) {
            console.error("Detalhes do erro (err.error):", err.error);
          }
          this.handleErrorSincronizacao(err);
        },
        complete: () => {
          console.log("===== SINCRONIZAÇÃO CONCLUÍDA =====");
          console.log("Observable completado com sucesso");
          // Mostra toast de sucesso
          this.alert.presentToast("Dados sincronizados com sucesso!", 2000);
          // Recarrega os dados sem deslogar
          setTimeout(() => {
            this.atualizarDadosAposSincronizacao();
          }, 1000);
        },
      });
  }

  mostrarResultadoSincronizacao(data: any) {
    // Apenas registra o resultado, sem mostrar alertas
    console.log("Resultado da sincronização:", data);
    // O usuário verá o toast de "Dados atualizados com sucesso!"
    // que será exibido pela função atualizarDadosAposSincronizacao
  }

  handleErrorSincronizacao(err: any) {
    console.error("Erro na sincronização:", err);

    let titulo = "❌ Erro na Sincronização";
    let mensagemErro = "Ocorreu um erro durante a sincronização.";
    let tipo = "danger";

    // Tratamento específico de erros
    if (err.name === "TimeoutError" || err.status === 504) {
      mensagemErro =
        "Tempo de sincronização excedido. Verifique sua conexão e tente novamente.";
      titulo = "⏱️ Tempo Esgotado";
    } else if (err.status === 500) {
      mensagemErro = "Erro no servidor. Tente novamente mais tarde.";
    } else if (err.status === 0 || err.status === 404) {
      mensagemErro =
        "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
      titulo = "🌐 Sem Conexão";
    } else if (err.error && err.error.message) {
      mensagemErro = err.error.message;
    } else if (err.message) {
      mensagemErro = err.message;
    }

    // Mostra toast com o erro
    this.alert.presentToast(mensagemErro, 3000);
  }

  atualizarDadosAposSincronizacao() {
    this.showLoading("Atualizando dados...", 30000);

    // Recarrega os dados
    this.dataLoad.dadosCarregados = false;

    this.movimento
      .buscaEmpresasBase(
        this.auth.userLogado.schema,
        this.auth.userLogado.cod_empresa_sel,
      )
      .pipe(
        tap((data: any) => {
          this.auth.userLogado.cod_empresa_usuario = data.message;
          this.empresas = this.auth.userLogado.cod_empresa_usuario;
          this.empresasFiltradas = [...this.empresas];
          this.dataLoad.dadosCarregados = true;
          this.loadingCtrl.dismiss();
          this.alert.presentToast("Dados atualizados com sucesso!", 3000);
        }),
        catchError((err) => {
          this.loadingCtrl.dismiss();
          this.alert.presentToast("Erro ao atualizar dados", 2000);
          throw err;
        }),
      )
      .subscribe();
  }

  sincronizaCadastros() {
    // Método mantido para compatibilidade, mas redireciona para o novo fluxo
    this.atualizaRegistro();
  }

  alteraUsuario(ev, item) {
    item.ind_aprova_negociacao = ev.detail.checked;

    const status = ev.detail.checked;

    this.movimento
      .updateUsuario(item.cod_usuario, this.auth.userLogado.schema, status)
      .pipe(
        tap((data) => {
          this.alert.presentToast(data.message, 3000);
          this.novoUsuario = new newUser();
        }),
        timeout(51000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      )
      .subscribe(() => {
        this.buscaUsuarios();
      });
  }

  cancel() {
    this.modal.dismiss(null, "cancel");
  }

  confirm() {
    this.modal.dismiss(null, "confirm");
  }

  toggleEmpresa(item: empresa) {
    const event = {
      detail: {
        checked: !item.ind_selecionado,
      },
    };
    this.selecaoEmpresa(event, item);
  }

  limparFiltroEmpresa() {
    this.empresasFiltradas = [...this.empresas];
  }

  logout() {
    this.auth.destroyToken();
  }

  async showLoading(message, duration) {
    const loading = await this.loadingCtrl.create({
      message: message,
      duration: duration,
    });
    loading.present();
  }

  private handleError(error: any) {
    if (error.name === "TimeoutError") {
      this.alert.presentToast(
        "Tempo de retorno da solicitação atingido, tente novamente",
        3000,
      );
    } else {
      this.alert.presentToast(
        "Tempo de retorno da solicitação atingido, tente novamente",
        3000,
      );
    }
  }
}
