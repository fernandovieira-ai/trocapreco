import { LoadingController } from '@ionic/angular';
import { Alert } from 'src/app/class/alert';
import { AuthService } from 'src/app/services/auth.service';
import { MovimentoService } from 'src/app/services/movimento.service';
import { minhasNegociacoes } from './../../class/user';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { tap, timeout, catchError } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-historico',
  templateUrl: './historico.page.html',
  styleUrls: ['./historico.page.scss'],
  standalone: false
})
export class HistoricoPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();


  public minhasNegociacoes: minhasNegociacoes[] = []
  public progress

  constructor(public auth: AuthService, private loadingCtrl: LoadingController, private movimento: MovimentoService, private alert: Alert, public router: Router) { }

  async ngOnInit() {

    await this.showLoading('Buscand Registros...', 50000)

    this.movimento.buscaMinhasNegociacoes(this.auth.userLogado.schema, this.auth.userLogado.cod_usuario, this.auth.userLogado.cod_empresa_sel).pipe(
      tap(data =>{
        this.minhasNegociacoes = data.message
        console.log(data.message)
      }),
      timeout(51000),
      catchError((err) => {
        this.loadingCtrl.dismiss();
        this.handleError(err);
        throw err;
      })
    ).subscribe(()=>{
      this.loadingCtrl.dismiss();
    });

  }

  goToHistoricoDetalhe(item, cod, ind_excluido) {
    this.router.navigate(['/home/historico/historico-detalhe'], {
      queryParams: { id: item, empresa: cod, ind_excluido: ind_excluido } // ou paramMap: { id: item.id }
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
