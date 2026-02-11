import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FiltroAtualizacaoPageRoutingModule } from './filtro-atualizacao-routing.module';

import { FiltroAtualizacaoPage } from './filtro-atualizacao.page';

import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FiltroAtualizacaoPageRoutingModule,
    ScrollingModule
  ],
  declarations: [FiltroAtualizacaoPage]
})
export class FiltroAtualizacaoPageModule {}
