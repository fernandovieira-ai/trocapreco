import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { tap, timeout, catchError, finalize, Subject, Subscription } from 'rxjs';
import { Alert } from 'src/app/class/alert';
import { minhasNegociacoesDetalhe } from 'src/app/class/user';
import { AuthService } from 'src/app/services/auth.service';
import { MovimentoService } from 'src/app/services/movimento.service';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-historico-detalhe',
  templateUrl: './historico-detalhe.page.html',
  styleUrls: ['./historico-detalhe.page.scss'],
  standalone: false
})
export class HistoricoDetalhePage implements OnInit {

  subscription: Subscription = new Subscription
  refresh = new Subject<void>()

  public detalhesNegociacao: minhasNegociacoesDetalhe[] = []
  id = 0
  empresa = 0
  ind_excluido = null
  ind_aprovacao = null

  constructor(private route: ActivatedRoute, public socket: WebsocketService, public auth: AuthService, private loadingCtrl: LoadingController, private movimento: MovimentoService, private alert: Alert, public router: Router) { }

  ngOnInit() {

    this.showLoading('Buscando Registros...', 50000)

    this.route.queryParams.subscribe(params => {
      this.id = params['id'];
      this.empresa = params['empresa'];
      this.ind_excluido = params['ind_excluido']
      this.ind_aprovacao = params['ind_aprovacao']

      this.movimento.buscaMinhasNegociacoesDetalhe(this.auth.userLogado.schema, this.auth.userLogado.cod_usuario, this.empresa, this.id, this.ind_aprovacao).pipe(
        tap(data =>{
          console.log(data)
          this.detalhesNegociacao = data.message.map(item => {
            const novoPreco = this.calcularNovoPreco(item);
            return {
              ...item,
              valor_calculado: novoPreco,
              margem: this.calculaMargem(novoPreco, item.val_custo_medio),
              margem_valor: this.calculaMargemValor(novoPreco, item.val_custo_medio),
              percentual_alteracao: this.calculaPercentualAlteracao(item.val_preco_venda, novoPreco)
            };
          });

        }),
        timeout(51000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
        finalize(() => {
          this.loadingCtrl.dismiss().catch(() => {});
        })
      ).subscribe(()=>{
      });
    });
  }

    aprovarRegra() {
      this.alert.presentAlertConfirm('ATENÇÃO', 'Este procedimento envia as regras para o EMSys3', 'Deseja Continuar ?').then(data => {
        if (data === 'sim') {
          this.showLoading('Aprovando Negociação...', 50000)

          this.movimento.aprovaRegra(this.auth.userLogado.schema, this.empresa, this.auth.userLogado.nom_usuario, this.id).pipe(
            tap(data => {
              this.alert.presentToast(data.message, 3000)
            }),
            timeout(51000),
            catchError((err) => {
              this.handleError(err);
              throw err;
            }),
            finalize(() => {
              this.loadingCtrl.dismiss().catch(() => {});
            })
          ).subscribe(() => {
            setTimeout(() => {
              this.router.navigate(['/home/historico/historico-detalhe']);
              this.socket.setAtualiacaoTarefas([{ cod_usuario: this.auth.userLogado.nom_usuario }], 'trocaPreco');
              this.refresh = new Subject<void>();
            }, 1000);
          });
        }
      })
    }

  excluirRegra(){
    this.alert.presentAlertConfirm('Excluir Lote de Registros', '', 'Deseja realmente continuar com esta operação ?').then( data =>{
      if(data == 'sim'){
        this.movimento.excluirNegociacao(this.auth.userLogado.schema, this.auth.userLogado.cod_usuario, this.empresa, this.id).pipe(
          tap(data =>{
            this.alert.presentToast(data.message, 3000);
          }),
          timeout(51000),
          catchError((err) => {
            this.loadingCtrl.dismiss();
            this.handleError(err);
            throw err;
          })
        ).subscribe(()=>{
          this.router.navigate(['/home']);
        });
      }
    })
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

  voltar() {
    this.router.navigate(['/home/aprovacao-negociacao']);
  }

  calcularNovoPreco(item: minhasNegociacoesDetalhe): number {
    // Pega o valor aplicado (pode estar em qualquer tipo de preço A, B, C, D, E)
    const valorAplicado = item.val_preco_venda_a || item.val_preco_venda_b || item.val_preco_venda_c || item.val_preco_venda_d || item.val_preco_venda_e || 0;

    if (item.ind_tipo_negociacao === 'P') {
      // Preço fixo
      return valorAplicado;
    } else if (item.ind_tipo_negociacao === 'A') {
      // Acréscimo
      if (item.ind_percentual_valor === 'P') {
        // Percentual
        return item.val_preco_venda + (valorAplicado / 100) * item.val_preco_venda;
      } else {
        // Valor
        return item.val_preco_venda + valorAplicado;
      }
    } else if (item.ind_tipo_negociacao === 'D') {
      // Desconto
      if (item.ind_percentual_valor === 'P') {
        // Percentual
        return item.val_preco_venda - (valorAplicado / 100) * item.val_preco_venda;
      } else {
        // Valor
        return item.val_preco_venda - valorAplicado;
      }
    }
    return item.val_preco_venda;
  }

  calculaMargem(precoVenda: number, custo: number): number {
    if (!custo || custo === 0) return 0;
    return ((precoVenda - custo) / precoVenda) * 100;
  }

  calculaMargemValor(precoVenda: number, custo: number): number {
    return precoVenda - custo;
  }

  calculaPercentualAlteracao(precoAtual: number, precoNovo: number): number {
    if (!precoAtual || precoAtual === 0) return 0;
    return ((precoNovo - precoAtual) / precoAtual) * 100;
  }
}
