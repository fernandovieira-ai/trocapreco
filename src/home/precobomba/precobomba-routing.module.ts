import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PrecobombaPage } from './precobomba.page';

const routes: Routes = [
  {
    path: '',
    component: PrecobombaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrecobombaPageRoutingModule {}
