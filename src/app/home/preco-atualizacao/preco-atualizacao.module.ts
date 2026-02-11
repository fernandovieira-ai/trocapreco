import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { PrecoAtualizacaoPageRoutingModule } from "./preco-atualizacao-routing.module";

import { PrecoAtualizacaoPage } from "./preco-atualizacao.page";

import { ScrollingModule } from "@angular/cdk/scrolling";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PrecoAtualizacaoPageRoutingModule,
    ScrollingModule,
  ],
  declarations: [PrecoAtualizacaoPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PrecoAtualizacaoPageModule {}
