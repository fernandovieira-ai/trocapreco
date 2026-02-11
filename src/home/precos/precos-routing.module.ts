import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PrecosPage } from './precos.page';

const routes: Routes = [
  {
    path: '',
    component: PrecosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrecosPageRoutingModule {}
