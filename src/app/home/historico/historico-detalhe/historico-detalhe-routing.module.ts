import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistoricoDetalhePage } from './historico-detalhe.page';

const routes: Routes = [
  {
    path: '',
    component: HistoricoDetalhePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistoricoDetalhePageRoutingModule {}
