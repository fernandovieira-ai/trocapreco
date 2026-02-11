

import { AlertController, ToastController } from '@ionic/angular';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Alert {
  constructor(public alertController: AlertController, private toastController: ToastController) { }

  async presentAlert(header, subheader, message) {

    // alert padrao pra exibiçao de mensagens

    const alert = await this.alertController.create({
      cssClass: 'custom-alert',
      mode: 'ios',
      header: header,
      subHeader: subheader,
      message: message,
      buttons: ['Entendi'],
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();
  }

  async presentAlertPrompt(): Promise<any> {

    // alert que recebe informaçao e retorna dados em promisse para a aplicaçao

    let result = '';

    const alert = await this.alertController.create({
      cssClass: 'custom-alert',
      backdropDismiss: false,
      header: 'Finalizar Veículo ?',
      subHeader: 'Informa o valor da comissão recebida',
      mode: 'ios',
      inputs: [
        {
          type: 'number',
          placeholder: 'Valor Comissão'
        },
        {
          type: 'date',
          placeholder: 'Data'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'OK',
          handler: data => {
            result = data
          },
        }
      ],
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return result;
  }

  async presentAlertPromptCustom(header, subheader): Promise<any> {

    // alert que recebe informaçao e retorna dados em promisse para a aplicaçao

    let result = '';

    const alert = await this.alertController.create({
      cssClass: 'custom-alert',
      backdropDismiss: false,
      header: header,
      subHeader: subheader,
      mode: 'ios',
      inputs: [
        {
          type: 'text',
          placeholder: 'PIX'
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'OK',
          handler: data => {
            result = data
          },
        }
      ],
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return result;
  }

  async presentToast(message, duration) {
    const toast = await this.toastController.create({
      message: message,
      cssClass: 'custom-alert',
      mode: 'ios',
      duration: duration,
      buttons: [{
        text: 'Fechar',
        role: 'cancel'
      }]
    });

    await toast.present();
  }

  async presentAlertPromptContagem(): Promise<any> {

    // alert que recebe informaçao e retorna dados em promisse para a aplicaçao

    let result = '';

    const alert = await this.alertController.create({
      cssClass: 'custom-alert',
      backdropDismiss: false,
      header: 'Quantidade',
      mode: 'ios',
      inputs: [
        {
          type: 'number',
          placeholder: 'Nova Quantidade'
        }],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'OK',
          handler: data => {
            result = data
          },
        }
      ],
    });
  }

  async presentAlertConfirm(header, subheader, message): Promise<any> {

    // alert que recebe informaçao e retorna dados em promisse para a aplicaçao

    let result = '';

    const alert = await this.alertController.create({
      cssClass: 'custom-alert',
      backdropDismiss: false,
      header: header,
      subHeader: subheader,
      message: message,
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'OK',
          handler: data => {
            result = 'sim'
          },
        }
      ],
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return result;
  }

  async presentAlertConfirmCuston(
    header: string,
    subheader: string,
    message: string,
    cancelText: string = 'Cancelar',
    confirmText: string = 'Confirmar',
    icon: string = 'sync-outline'
  ): Promise<boolean> {

    const alert = await this.alertController.create({
      cssClass: 'custom-alert-professional with-icon',
      backdropDismiss: false,
      header: this.getIconHtml(icon) + header, // Adiciona ícone no header
      subHeader: subheader,
      message: message,
      mode: 'ios',
      keyboardClose: true,
      animated: true,
      buttons: [
        {
          text: cancelText,
          role: 'cancel',
          cssClass: 'alert-button-cancel',
          handler: () => {
            return false;
          }
        },
        {
          text: confirmText,
          cssClass: 'alert-button-confirm',
          handler: () => {
            return true;
          }
        }
      ]
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role !== 'cancel';
  }

  private getIconHtml(iconName: string): string {
    const icons: { [key: string]: string } = {
      'sync': '🔄',
      'warning': '⚠️',
      'info': 'ℹ️',
      'success': '✅',
      'error': '❌',
      'cloud': '☁️',
      'database': '🗄️'
    };

    return `${icons[iconName] || icons['sync']}`;
  } 


  async presentAlertPromptSenha(): Promise<any> {

    // alert que recebe informaçao e retorna dados em promisse para a aplicaçao

    let result = '';

    const alert = await this.alertController.create({
      cssClass: 'custom-alert',
      backdropDismiss: false,
      header: 'Nova Senha',
      subHeader: 'Apenas números e maior que 4 digitos',
      mode: 'ios',
      inputs: [
        {
          type: 'password',
          placeholder: 'Senha'
        }],
      buttons: [
        {
          text: 'OK',
          handler: data => {
            result = data
          },
        }
      ],
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return result;
  }

  async presentAlertRadio(message, subHeader, itens) {

    let result = '';

    const alert = await this.alertController.create({
      cssClass: 'custom-alert',
      header: message,
      subHeader: subHeader,
      backdropDismiss: false,
      mode: 'ios',
      inputs: itens,
      buttons: [{
        text: 'Cancelar',
        role: 'cancel',
        handler: data => {
          result = 'false'
        },
      },
      {
        text: 'Confirmar',
        handler: data => {
          result = data
        },
      }]
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return result;
  }
}
