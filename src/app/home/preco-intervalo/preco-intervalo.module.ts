import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { PrecoIntervaloPageRoutingModule } from "./preco-intervalo-routing.module";

import { PrecoIntervaloPage } from "./preco-intervalo.page";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PrecoIntervaloPageRoutingModule,
  ],
  declarations: [PrecoIntervaloPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PrecoIntervaloPageModule {}
