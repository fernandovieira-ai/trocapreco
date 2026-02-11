import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { PrecobombaPageRoutingModule } from "./precobomba-routing.module";

import { PrecobombaPage } from "./precobomba.page";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PrecobombaPageRoutingModule,
  ],
  declarations: [PrecobombaPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PrecobombaPageModule {}
