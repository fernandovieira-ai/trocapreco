import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { HistoricoPageRoutingModule } from "./historico-routing.module";

import { HistoricoPage } from "./historico.page";

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, HistoricoPageRoutingModule],
  declarations: [HistoricoPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HistoricoPageModule {}
