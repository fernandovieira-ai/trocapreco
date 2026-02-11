import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PrecoAtualizacaoPage } from './preco-atualizacao.page';

const routes: Routes = [
  {
    path: '',
    component: PrecoAtualizacaoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrecoAtualizacaoPageRoutingModule {}
