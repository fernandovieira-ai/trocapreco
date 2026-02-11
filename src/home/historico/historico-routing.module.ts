import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistoricoPage } from './historico.page';

const routes: Routes = [
  {
    path: '',
    component: HistoricoPage
  },
  {
    path: 'historico-detalhe',
    loadChildren: () => import('./historico-detalhe/historico-detalhe.module').then( m => m.HistoricoDetalhePageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistoricoPageRoutingModule {}
