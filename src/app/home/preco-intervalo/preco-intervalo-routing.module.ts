import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PrecoIntervaloPage } from './preco-intervalo.page';

const routes: Routes = [
  {
    path: '',
    component: PrecoIntervaloPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrecoIntervaloPageRoutingModule {}
