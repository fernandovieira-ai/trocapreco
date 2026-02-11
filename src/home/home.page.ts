import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MovimentoService } from '../services/movimento.service';
import { IonModal, LoadingController, Platform } from '@ionic/angular';
import { Alert } from '../class/alert';
import { catchError, finalize, tap, timeout } from 'rxjs';
import { empresa, newUser, user } from '../class/user';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { WebsocketService } from '../services/websocket.service';
import { DataloadService } from '../services/dataload.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  @ViewChild(IonModal) modal: IonModal;

  isModalOpenUser = false;

  public novoUsuario: newUser = new newUser();
  public listaDeUsuarios: user[] = []

  public empresas: empresa[] = [];
  public empresasFiltradas: empresa[] = []
  public empresaSel = 'Selecione'

  constructor(public auth: AuthService, public socket: WebsocketService, private location: Location, 
    private router: Router, private route: ActivatedRoute, private loadingCtrl: LoadingController, 
    private movimento: MovimentoService, private alert: Alert, public dataLoad: DataloadService) {
  }

  ngOnInit() {
    //this.route.queryParams.subscribe(params => {
    //console.log(params);
    //const schema = params['schema'];

    // Oculta os parâmetros da URL
    this.location.replaceState(this.router.createUrlTree([], { relativeTo: this.route }).toString());

    //this.showLoading('Buscando Empresas...', 50000);

    console.log(this.auth.userLogado)

    this.movimento.buscaEmpresasBase(this.auth.userLogado.schema, this.auth.userLogado.empresa).pipe(
      tap(data => {
        this.empresas = data.message;
        this.empresasFiltradas = [...this.empresas];
      }),
      timeout(51000),
      catchError(err => {
        this.loadingCtrl.dismiss();
        this.handleError(err);
        throw err;
      })
    ).subscribe(() => {
      this.loadingCtrl.dismiss();
    });
    // });

    this.buscaFiltrosPreLoad();

    setTimeout(() => {
      this.socket.usuarioApp(this.auth.userLogado.nom_usuario, 'trocaPreco')
    }, 3000);
  }

  buscaFiltrosPreLoad() {
    this.alert.presentToast('Carregando dados em background...', 5000)

    const filtroObservable = this.movimento.buscaFiltroPreLoad(this.auth.userLogado.schema).pipe(
      timeout(301000),
    );

    filtroObservable
      .pipe(
        tap(data => {
          this.dataLoad.pessoa = data.pessoa
          this.dataLoad.regiao = data.regiao
          this.dataLoad.subGrupo = data.subGrupo
        }),
        finalize(() => this.dataLoad.dadosCarregados = true),
        catchError((error) => {
          this.handleError(error);
          throw error;
        })
      )
      .subscribe();
  }

  alterarSenha() {

    this.alert.presentAlertPromptSenha().then(data => {
      console.log(data[0])
      if (data[0] === '' || data[0].length < 4) {
        this.alert.presentToast('Senha Inválida', 3000)
      } else {
        this.movimento.alterarSenha(this.auth.userLogado.cod_usuario, data[0]).pipe(
          tap(data => {
            this.alert.presentToast(data.message, 3000)
          }),
          timeout(51000),
          catchError(err => {
            this.handleError(err);
            throw err;
          })
        ).subscribe(() => {
        });
      }
    })
  }

  pesquisaEmpresa(event) {
    const query = event.target.value.toLowerCase();
    this.empresasFiltradas = this.empresas.filter((d) =>
      d.nom_fantasia.toLowerCase().indexOf(query) > -1 ||
      d.cod_empresa == query);
  }

  selecaoEmpresa(ev, item) {
    //const seuEvento = { detail: { checked: true } }; // Simulando um evento

    const status = ev.detail.checked

    if (status) {
      item.ind_selecionado = true
      this.auth.userLogado.cod_empresa_usuario.push(item)
      this.auth.userLogado.cod_empresa_sel.push(item.cod_empresa)
    } else {
      this.removerItemPorCodEmpresa(this.auth.userLogado.cod_empresa_usuario, item.cod_empresa)
      this.removerItemPorIndexEmpresa(this.auth.userLogado.cod_empresa_sel, item.cod_empresa)
      item.ind_selecionado = false
    }
  }

  marcarTodosItens() {

    this.auth.userLogado.cod_empresa_sel = []
    this.auth.userLogado.cod_empresa_usuario = []

    for (const row of this.empresasFiltradas) {
      row.ind_selecionado = true
      this.auth.userLogado.cod_empresa_usuario.push(row)
      this.auth.userLogado.cod_empresa_sel.push(row.cod_empresa);
    }
  }

  desmarcarTodosItens() {
    for (const row of this.empresasFiltradas) {
      row.ind_selecionado = false
    }
    this.auth.userLogado.cod_empresa_sel = []
    this.auth.userLogado.cod_empresa_usuario = []
  }

  removerItemPorCodEmpresa(array, codEmpresa) {
    // Encontra o índice do item com o código de empresa fornecido
    const index = array.findIndex(item => item.cod_empresa == codEmpresa);

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
    const index = array.findIndex(item => item == codEmpresa);

    // Se encontrar o item, remove-o do array
    if (index !== -1) {
      array.splice(index, 1);
      console.log(`Item com o código de empresa ${codEmpresa} removido.`);
    } else {
      console.log(`Item com o código de empresa ${codEmpresa} não encontrado.`);
    }

  }

  criarCadastroUsuario() {

    const { nom_usuario, senha, schema, des_rede, img_rede, ind_aprova_negociacao } = this.novoUsuario

    if (senha.toString().length < 10) {
      this.movimento.novoUsuario(nom_usuario, senha, schema, des_rede, img_rede, ind_aprova_negociacao).pipe(
        tap(data => {
          this.alert.presentToast(data.message, 3000)
          this.novoUsuario = new newUser();
        }),
        timeout(51000),
        catchError(err => {
          this.handleError(err);
          throw err;
        })
      ).subscribe(() => {
        this.buscaUsuarios()
      });
    }
  }

  removeUser(item) {
    this.movimento.removeUsuario(item.cod_usuario, this.auth.userLogado.schema).pipe(
      tap(data => {
        this.alert.presentToast(data.message, 3000)
        this.novoUsuario = new newUser();
      }),
      timeout(51000),
      catchError(err => {
        this.handleError(err);
        throw err;
      })
    ).subscribe(() => {
      this.buscaUsuarios()
    });
  }

  buscaUsuarios() {
    this.movimento.buscaUsuario(this.auth.userLogado.schema).pipe(
      tap(data => {
        this.listaDeUsuarios = data.message
      }),
      timeout(51000),
      catchError(err => {
        this.handleError(err);
        throw err;
      })
    ).subscribe(() => {
    });
  }

  setOpen(isOpen: boolean) {
    this.isModalOpenUser = isOpen;
    this.novoUsuario.des_rede = this.auth.userLogado.des_rede
    this.novoUsuario.img_rede = this.auth.userLogado.img_rede
    this.novoUsuario.schema = this.auth.userLogado.schema
    this.buscaUsuarios();
  }

  setAprovaNegociacao(ev) {
    const status = ev.detail.checked
    if (status) {
      this.novoUsuario.ind_aprova_negociacao = 'S'
    } else {
      this.novoUsuario.ind_aprova_negociacao = 'N'
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
  this.alert.presentAlertConfirmCuston(
    'Sincronização de Dados',
    'Este processo pode levar vários minutos para concluir.',
    'Ao finalizar, você será automaticamente desconectado e poderá iniciar uma nova sessão com os dados atualizados.',
    'Cancelar',
    'Iniciar Sincronização'
  ).then(data => {
    if (data) {
      this.executarSincronizacao();
    }
  });
}

executarSincronizacao() {
  this.showLoading('Iniciando sincronização de dados...', 550000);

  this.movimento.sincronizaCadastros(this.auth.userLogado.schema).pipe(
    timeout(560000),
    finalize(() => {
      // Garante que o loading seja fechado em qualquer caso
      setTimeout(() => {
        this.loadingCtrl.dismiss().catch(() => {});
      }, 500);
    })
  ).subscribe({
    next: (data) => {
      this.mostrarResultadoSincronizacao(data);
    },
    error: (err) => {
      this.handleErrorSincronizacao(err);
    },
    complete: () => {
      // Aguarda 2 segundos após o feedback para deslogar
      setTimeout(() => {
        this.logout();
      }, 2000);
    }
  });
}

mostrarResultadoSincronizacao(data: any) {
  let titulo: string;
  let mensagem: string;
  let tipo: string;
  let icone: string;

  // Verifica a mensagem retornada pelo servidor
  if (data.message && data.message.toLowerCase().includes('baixados')) {
    titulo = '✅ Sincronização Concluída';
    mensagem = 'Preços e cadastros atualizados com sucesso!';
    
    if (data.registros_baixados) {
      mensagem += `<br><br><strong>${data.registros_baixados}</strong> registros processados.`;
    }
    
    if (data.detalhe) {
      mensagem += `<br><small>${data.detalhe}</small>`;
    }
    
    tipo = 'success';
    icone = 'checkmark-circle';
  } else if (data.message && data.message.toLowerCase().includes('nenhum') || 
             data.message && data.message.toLowerCase().includes('não encontrado')) {
    titulo = '⚠️ Sem Alterações';
    mensagem = data.message || 'Nenhuma alteração encontrada nos preços.';
    tipo = 'warning';
    icone = 'information-circle';
  } else {
    titulo = '✅ Processo Finalizado';
    mensagem = data.message || 'Sincronização concluída.';
    tipo = 'success';
    icone = 'checkmark-circle';
  }

  // Mostra toast imediato
  this.alert.presentToast(mensagem.replace(/<br>/g, ' '), 3000);

  // Mostra alerta detalhado
  // setTimeout(() => {
  //   this.alert.presentAlert(
  //     titulo,
  //     `${mensagem}<br><br>Você será desconectado para aplicar as alterações.`,
  //     'OK',
  //     null,
  //     tipo,
  //     icone
  //   );
  // }, 500);
}

handleErrorSincronizacao(err: any) {
  console.error('Erro na sincronização:', err);

  let titulo = '❌ Erro na Sincronização';
  let mensagemErro = 'Ocorreu um erro durante a sincronização.';
  let tipo = 'danger';
  
  // Tratamento específico de erros
  if (err.name === 'TimeoutError' || err.status === 504) {
    mensagemErro = 'Tempo de sincronização excedido. Verifique sua conexão e tente novamente.';
    titulo = '⏱️ Tempo Esgotado';
  } else if (err.status === 500) {
    mensagemErro = 'Erro no servidor. Tente novamente mais tarde.';
  } else if (err.status === 0 || err.status === 404) {
    mensagemErro = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
    titulo = '🌐 Sem Conexão';
  } else if (err.error && err.error.message) {
    mensagemErro = err.error.message;
  } else if (err.message) {
    mensagemErro = err.message;
  }

  // Mostra alerta de erro
  // this.alert.presentAlert(
  //   titulo,
  //   mensagemErro,
  //   'OK',
  //   null,
  //   tipo,
  //   'alert-circle'
  // );
}

sincronizaCadastros() {
  // Método mantido para compatibilidade, mas redireciona para o novo fluxo
  this.atualizaRegistro();
}

  alteraUsuario(ev, item) {
    item.ind_aprova_negociacao = ev.detail.checked

    const status = ev.detail.checked

    this.movimento.updateUsuario(item.cod_usuario, this.auth.userLogado.schema, status).pipe(
      tap(data => {
        this.alert.presentToast(data.message, 3000)
        this.novoUsuario = new newUser();
      }),
      timeout(51000),
      catchError(err => {
        this.handleError(err);
        throw err;
      })
    ).subscribe(() => {
      this.buscaUsuarios()
    });
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
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
    if (error.name === 'TimeoutError') {
      this.alert.presentToast('Tempo de retorno da solicitação atingido, tente novamente', 3000);
    } else {
      this.alert.presentToast('Tempo de retorno da solicitação atingido, tente novamente', 3000);
    }
  }

}
