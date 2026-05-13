import { Component, signal, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Tarefa } from "./tarefa";
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('TODOapp');

  arrayDeTarefas = signal<Tarefa[]>([]);
  apiURL: string;
  usuarioLogado = signal(false);
  roleUsuario = signal('');

  tokenJWT = '{ "token": "" }';

  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {
   this.apiURL = 'https://tarefasapijoaopedro252959lucasmoraes2528.onrender.com';
  }

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) { }
  }

  // ─── Login ──────────────────────────────────────────────────────────────────
  Login(username: string, password: string) {
    var credenciais = { "nome": username, "senha": password };

    this.http.post(`${this.apiURL}/api/login`, credenciais).subscribe({
      next: (resultado: any) => {
        this.tokenJWT = JSON.stringify(resultado);
        this.roleUsuario.set(resultado.role);
        this.READ_tarefas();
      },
      error: (err) => alert('Erro: ' + JSON.stringify(err.error))
      //error: () => alert('Usuário ou senha inválidos!')
    });
  }

  // ─── CRUD Tarefas ────────────────────────────────────────────────────────────
  CREATE_tarefa(descricaoNovaTarefa: string) {
    const novaTarefa = new Tarefa(descricaoNovaTarefa, false);
    const token = JSON.parse(this.tokenJWT).token;

    this.http.post<Tarefa>(`${this.apiURL}/api/post`, novaTarefa, {
      headers: { 'id-token': token }
    }).subscribe(() => this.READ_tarefas());
  }

  async READ_tarefas(retry = true): Promise<void> {
    try {
      const token = JSON.parse(this.tokenJWT).token;

      const resultado = await firstValueFrom(
        this.http.get<Tarefa[]>(`${this.apiURL}/api/getAll`, {
          headers: { 'Cache-Control': 'no-cache', 'id-token': token }
        })
      );

      this.arrayDeTarefas.set(resultado);
      this.usuarioLogado.set(true);

    } catch (erro) {
      console.error("Erro ao carregar tarefas:", erro);
      this.usuarioLogado.set(false);

      if (retry) {
        setTimeout(() => this.READ_tarefas(false), 2000);
      }
    }
  }

  DELETE_tarefa(tarefa: Tarefa) {
    const token = JSON.parse(this.tokenJWT).token;

    this.http.delete<Tarefa>(`${this.apiURL}/api/delete/${tarefa._id}`, {
      headers: { 'id-token': token }
    }).subscribe(() => this.READ_tarefas());
  }

  UPDATE_tarefa(tarefa: Tarefa) {
    const token = JSON.parse(this.tokenJWT).token;

    this.http.patch<Tarefa>(
      `${this.apiURL}/api/update/${tarefa._id}`,
      tarefa,
      { headers: { 'id-token': token } }
    ).subscribe(() => this.READ_tarefas());
  }

  // ─── Gerenciamento de Usuários (ADM) ────────────────────────────────────────
  listaUsuarios = signal<any[]>([]);
  painelAdminAberto = signal(false);

  toggleAdminPainel() {
    this.painelAdminAberto.set(!this.painelAdminAberto());
    if (this.painelAdminAberto() && this.listaUsuarios().length === 0) {
      this.LISTAR_usuarios();
    }
  }

  LISTAR_usuarios() {
    const token = JSON.parse(this.tokenJWT).token;
    this.http.get<any[]>(`${this.apiURL}/api/usuarios`, {
      headers: { 'id-token': token }
    }).subscribe({
      next: (res) => this.listaUsuarios.set(res),
      error: (err) => console.error('Erro ao listar usuarios:', err)
    });
  }

  CRIAR_usuario(nome: string, senha: string, role: string) {
    if (!nome || !senha) return;
    const token = JSON.parse(this.tokenJWT).token;
    this.http.post(`${this.apiURL}/api/usuarios`, { nome, senha, role }, {
      headers: { 'id-token': token }
    }).subscribe({
      next: () => { alert('Usuário criado!'); this.LISTAR_usuarios(); },
      error: (err) => alert('Erro: ' + err.error.message)
    });
  }

  EDITAR_usuario(id: string, nome: string) {
    const novoNome = prompt('Novo nome:', nome);
    if (!novoNome) return;
    const token = JSON.parse(this.tokenJWT).token;
    this.http.patch(`${this.apiURL}/api/usuarios/${id}`, { nome: novoNome }, {
      headers: { 'id-token': token }
    }).subscribe({
      next: () => this.LISTAR_usuarios(),
      error: (err) => alert('Erro: ' + err.error.message)
    });
  }

  DELETAR_usuario(id: string) {
    if (!confirm('Deseja remover este usuário?')) return;
    const token = JSON.parse(this.tokenJWT).token;
    this.http.delete(`${this.apiURL}/api/usuarios/${id}`, {
      headers: { 'id-token': token }
    }).subscribe({
      next: () => { alert('Usuário removido!'); this.LISTAR_usuarios(); },
      error: (err) => alert('Erro: ' + err.error.message)
    });
  }
}
