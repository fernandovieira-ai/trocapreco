import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AprovacaoNegociacaoPage } from './aprovacao-negociacao.page';

const routes: Routes = [
  {
    path: '',
    component: AprovacaoNegociacaoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AprovacaoNegociacaoPageRoutingModule {}
