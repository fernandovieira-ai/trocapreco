import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrecoIntervaloPage } from './preco-intervalo.page';

describe('PrecoIntervaloPage', () => {
  let component: PrecoIntervaloPage;
  let fixture: ComponentFixture<PrecoIntervaloPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(PrecoIntervaloPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
