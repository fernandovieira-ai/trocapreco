import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FiltroPage } from './filtro.page';

describe('FiltroPage', () => {
  let component: FiltroPage;
  let fixture: ComponentFixture<FiltroPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(FiltroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
