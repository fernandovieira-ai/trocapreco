import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { tap, timeout, catchError, debounceTime, distinctUntilChanged, Subscription, Subject } from 'rxjs';
import { Alert } from 'src/app/class/alert';
import { minhasNegociacoes } from 'src/app/class/user';
import { AuthService } from 'src/app/services/auth.service';
import { MovimentoService } from 'src/app/services/movimento.service';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-aprovacao-negociacao',
  templateUrl: './aprovacao-negociacao.page.html',
  styleUrls: ['./aprovacao-negociacao.page.scss'],
  standalone: false
})
export class AprovacaoNegociacaoPage implements OnInit, OnDestroy {

  public negociacoesEmpresa: minhasNegociacoes[] = []
  public progress
  subscription: Subscription = new Subscription
  refresh = new Subject<void>();

  constructor(public auth: AuthService, public socket: WebsocketService, private loadingCtrl: LoadingController, public movimento: MovimentoService, private alert: Alert, public router: Router) { }

  ngOnInit() {


      this.socket.usuarioApp(this.auth.userLogado.nom_usuario, 'trocaPreco')

      this.subscription = this.socket.getAtualizacaoTarefas().pipe(
        debounceTime(100),
        distinctUntilChanged(),
        tap(() => {
          console.log('executando busca tarefas pelo subscribe');
          this.buscaNegociacoesEmpresa();
          this.socket.observableExecutado = 1
        }),
        catchError(err => {
          console.log('erro do observable', err);
          this.alert.presentToast(err.error.message, 4000);
          throw err;
        })
      ).subscribe();

      if (this.socket.observableExecutado == 0) {
        this.buscaNegociacoesEmpresaStart();
      }


  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      console.log('subscription cancelada no ionViewWillLeave');
        this.socket.socketExitApp([{ cod_usuario: this.auth.userLogado.nom_usuario }], 'trocaPreco');
    }
  }

  buscaNegociacoesEmpresa() {
    this.showLoading('Buscand Registros...', 50000)

    this.movimento.buscaNegociacoesEmpresa(this.auth.userLogado.schema, this.auth.userLogado.cod_empresa_sel).pipe(
      tap(data => {
        this.negociacoesEmpresa = data.message
        console.log(data.message)
      }),
      timeout(51000),
      catchError((err) => {
        this.loadingCtrl.dismiss();
        this.handleError(err);
        throw err;
      })
    ).subscribe(() => {
      this.loadingCtrl.dismiss();
    });
  }

  buscaNegociacoesEmpresaStart() {
    this.showLoading('Buscand Registros...', 50000)

    this.movimento.buscaNegociacoesEmpresa(this.auth.userLogado.schema, this.auth.userLogado.cod_empresa_sel).pipe(
      tap(data => {
        this.negociacoesEmpresa = data.message
        console.log(data.message)
      }),
      timeout(51000),
      catchError((err) => {
        this.loadingCtrl.dismiss();
        this.handleError(err);
        throw err;
      })
    ).subscribe(() => {
      this.loadingCtrl.dismiss();
      this.socket.executouBuscaTarefas = 1
    });
  }

  aprovarRegra(seq_lote, item) {
    this.alert.presentAlertConfirm('ATENÇÃO', 'Este procedimento envia as regras para o EMSys3', 'Deseja Continuar ?').then(data => {
      if (data === 'sim') {
        this.showLoading('Buscand Registros...', 50000)

        this.movimento.aprovaRegra(this.auth.userLogado.schema, item.cod_empresa, this.auth.userLogado.nom_usuario, seq_lote).pipe(
          tap(data => {
            this.alert.presentToast(data.message, 3000)
          }),
          timeout(51000),
          catchError((err) => {
            this.loadingCtrl.dismiss();
            this.handleError(err);
            throw err;
          })
        ).subscribe(() => {
          this.loadingCtrl.dismiss();
          setTimeout(() => {
            this.socket.setAtualiacaoTarefas([{ cod_usuario: this.auth.userLogado.nom_usuario }], 'trocaPreco');
            this.refresh = new Subject<void>();
          }, 1000);
        });
      }
    })
  }

  goToHistoricoDetalhe(item, cod, ind_excluido) {
    this.router.navigate(['/home/historico/historico-detalhe'], {
      queryParams: { id: item, empresa: cod, ind_excluido: ind_excluido, ind_aprovacao: 'S' } // ou paramMap: { id: item.id }
    });
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
