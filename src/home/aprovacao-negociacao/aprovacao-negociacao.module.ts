import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AprovacaoNegociacaoPageRoutingModule } from './aprovacao-negociacao-routing.module';

import { AprovacaoNegociacaoPage } from './aprovacao-negociacao.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AprovacaoNegociacaoPageRoutingModule
  ],
  declarations: [AprovacaoNegociacaoPage]
})
export class AprovacaoNegociacaoPageModule {}
