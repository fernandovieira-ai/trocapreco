import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePage } from './home.page';
import { AuthGuard } from '../services/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: HomePage,
    canActivate: [AuthGuard]
  },
  {
    path: 'filtro',
    loadChildren: () => import('./filtro/filtro.module').then( m => m.FiltroPageModule)
  },
  {
    path: 'historico',
    loadChildren: () => import('./historico/historico.module').then( m => m.HistoricoPageModule)
  },
  {
    path: 'precos',
    loadChildren: () => import('./precos/precos.module').then( m => m.PrecosPageModule)
  },
  {
    path: 'filtro-atualizacao',
    loadChildren: () => import('./filtro-atualizacao/filtro-atualizacao.module').then( m => m.FiltroAtualizacaoPageModule)
  },
  {
    path: 'preco-atualizacao',
    loadChildren: () => import('./preco-atualizacao/preco-atualizacao.module').then( m => m.PrecoAtualizacaoPageModule)
  },
  {
    path: 'precobomba',
    loadChildren: () => import('./precobomba/precobomba.module').then( m => m.PrecobombaPageModule)
  },
  {
    path: 'aprovacao-negociacao',
    loadChildren: () => import('./aprovacao-negociacao/aprovacao-negociacao.module').then( m => m.AprovacaoNegociacaoPageModule)
  },
  {
    path: 'preco-intervalo',
    loadChildren: () => import('./preco-intervalo/preco-intervalo.module').then( m => m.PrecoIntervaloPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomePageRoutingModule {}
