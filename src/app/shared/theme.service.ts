import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private currentModeSubject = new BehaviorSubject<ThemeMode>('light');
  currentMode$ = this.currentModeSubject.asObservable();
  
  private isDarkThemeSubject = new BehaviorSubject<boolean>(false);
  isDarkTheme$ = this.isDarkThemeSubject.asObservable();

  private mediaQuery: MediaQueryList;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', (e) => {
      if (this.currentModeSubject.value === 'system') {
        this.applyActualTheme(e.matches);
      }
    });
    this.initTheme();
  }

  private initTheme() {
    const savedMode = localStorage.getItem('app-theme-mode') as ThemeMode || 'light';
    this.setThemeMode(savedMode);
  }

  setThemeMode(mode: ThemeMode) {
    this.currentModeSubject.next(mode);
    localStorage.setItem('app-theme-mode', mode);
    
    let isDark = false;
    if (mode === 'system') {
      isDark = this.mediaQuery.matches;
    } else {
      isDark = mode === 'dark';
    }
    this.applyActualTheme(isDark);
  }

  private applyActualTheme(isDark: boolean) {
    this.isDarkThemeSubject.next(isDark);
    if (isDark) {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }
  }
}
