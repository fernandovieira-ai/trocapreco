import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FiltroAtualizacaoPage } from './filtro-atualizacao.page';

const routes: Routes = [
  {
    path: '',
    component: FiltroAtualizacaoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FiltroAtualizacaoPageRoutingModule {}
