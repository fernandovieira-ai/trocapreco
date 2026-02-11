import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { HistoricoDetalhePageRoutingModule } from "./historico-detalhe-routing.module";

import { HistoricoDetalhePage } from "./historico-detalhe.page";

import { ScrollingModule } from "@angular/cdk/scrolling";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistoricoDetalhePageRoutingModule,
    ScrollingModule,
  ],
  declarations: [HistoricoDetalhePage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HistoricoDetalhePageModule {}
