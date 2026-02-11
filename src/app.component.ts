import { Component, HostListener, OnInit } from '@angular/core';

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { interval, Subscription } from 'rxjs';
import { Router, NavigationStart } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Platform, ToastController } from '@ionic/angular';

export let browserRefresh = true;

const firebaseConfig = {
  apiKey: "AIzaSyCyEIo7AO1lot2Mbj1EisfvMItFjb0l60E",
  authDomain: "drf-trocaprecos.firebaseapp.com",
  projectId: "drf-trocaprecos",
  storageBucket: "drf-trocaprecos.appspot.com",
  messagingSenderId: "1057343084761",
  appId: "1:1057343084761:web:fc4ceb150068772b6c86c8"
};


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private subscriptions = new Subscription(); // unificado
  private platform: Platform

  atualizacaoDisponivel = false;
  subscription: Subscription;


  constructor(private router: Router, private auth: AuthService, private swUpdate: SwUpdate,
    private toastController: ToastController) {
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);

    this.subscription = router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        browserRefresh = !router.navigated;
      }
    });
  }

  ngOnInit(): void {
    //this.adjustForLargeScreens();
    //window.addEventListener('resize', this.adjustForLargeScreens.bind(this));
    if (this.swUpdate.isEnabled) {
      const updateSub = this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {
        if (event.type === 'VERSION_READY') {
          this.atualizacaoDisponivel = true;
          this.mostrarToastAtualizacao(); // Chama apenas aqui
        }
      });

      this.subscriptions.add(updateSub);

      const intervalSub = interval(300000).subscribe(() => {
        this.swUpdate.checkForUpdate();
      });

      this.subscriptions.add(intervalSub);
    }

    if (browserRefresh === true) {
      this.auth.destroyToken();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.adjustForLargeScreens();
  }

  private adjustForLargeScreens() {
    const screenWidth = window.innerWidth;
    const body = document.body;

    // Remove classes antigas
    body.classList.remove('screen-small', 'screen-medium', 'screen-large', 'screen-xlarge');

    // Adiciona classe baseada no tamanho da tela
    if (screenWidth >= 1920) {
      body.classList.add('screen-xlarge');
    } else if (screenWidth >= 1440) {
      body.classList.add('screen-large');
    } else if (screenWidth >= 1024) {
      body.classList.add('screen-medium');
    } else {
      body.classList.add('screen-small');
    }

    // Adiciona CSS dinâmico para telas muito grandes
    if (screenWidth > 1400) {
      const styleId = 'dynamic-screen-style';
      let style = document.getElementById(styleId);

      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
      }

      // Calcula a margem para centralizar perfeitamente
      const margin = Math.max(0, (screenWidth - 1400) / 2);
      style.textContent = `
        ion-content.conteudo {
          margin: 0 ${margin}px !important;
          width: calc(100% - ${margin * 2}px) !important;
        }
        
        ion-header.conteudo,
        ion-footer.conteudo {
          margin: 0 ${margin}px !important;
          width: calc(100% - ${margin * 2}px) !important;
        }
      `;
    }
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.adjustForLargeScreens.bind(this));
  }

  async mostrarToastAtualizacao() {
    const toast = await this.toastController.create({
      message: 'Nova versão disponível!',
      duration: 200000,
      position: 'bottom',
      cssClass: 'custom-alert',
      icon: 'cloud-download-outline',
      mode: 'ios',
      animated: true,
      buttons: [
        {
          side: 'end',
          text: 'Atualizar Agora',
          handler: () => {
            this.forcarAtualizacao();
          }
        }
      ]
    });

    await toast.present();
  }

  forcarAtualizacao() {

    this.router.navigate(['/login'])

    this.swUpdate.activateUpdate().then(() => {
      window.location.reload();
    });
  }
}
