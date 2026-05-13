const express = require('express');
const router = express.Router();
module.exports = router;
 
const modeloTarefa = require('../models/tarefa');
const userModel = require('../models/user');
const jwt = require('jsonwebtoken');
 
// ─── Middleware: verifica JWT ─────────────────────────────────────────────────
function verificaJWT(req, res, next) {
    const token = req.headers['id-token'];
    if (!token) return res.status(401).json({ auth: false, message: 'Token nao fornecido' });
 
    jwt.verify(token, 'segredo', function (err, decoded) {
        if (err) return res.status(500).json({ auth: false, message: 'Token invalido' });
        req.usuarioRole = decoded.role;
        next();
    });
}
 
// ─── Middleware: verifica se é ADM ────────────────────────────────────────────
function verificaADM(req, res, next) {
    const token = req.headers['id-token'];
    if (!token) return res.status(401).json({ message: 'Token nao fornecido' });
 
    jwt.verify(token, 'segredo', function (err, decoded) {
        if (err || decoded.role !== 'adm') {
            return res.status(403).json({ message: 'Acesso restrito a administradores' });
        }
        next();
    });
}
 
// ─── Login — busca usuário no BD e compara senha ──────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const data = await userModel.findOne({ nome: req.body.nome });
 
        if (data != null && data.senha === req.body.senha) {
            const token = jwt.sign({ id: data._id, role: data.role }, 'segredo', { expiresIn: 300 });
            return res.json({ token: token, role: data.role });
        }
 
        res.status(500).json({ message: 'Login invalido!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
 
// ─── CRUD Tarefas (protegidos por JWT) ───────────────────────────────────────
router.post('/post', verificaJWT, async (req, res) => {
    const objetoTarefa = new modeloTarefa({
        descricao: req.body.descricao,
        statusRealizada: req.body.statusRealizada
    });
    try {
        const tarefaSalva = await objetoTarefa.save();
        res.status(200).json(tarefaSalva);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
 
router.get('/getAll', verificaJWT, async (req, res) => {
    try {
        const resultados = await modeloTarefa.find();
        res.json(resultados);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
 
router.delete('/delete/:id', verificaJWT, async (req, res) => {
    try {
        const resultado = await modeloTarefa.findByIdAndDelete(req.params.id);
        res.json(resultado);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
 
router.patch('/update/:id', verificaJWT, async (req, res) => {
    try {
        const result = await modeloTarefa.findByIdAndUpdate(
            req.params.id, req.body, { new: true }
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
 
// ─── Gerenciamento de Usuários (somente ADM) ──────────────────────────────────
 
// Listar todos os usuários
router.get('/usuarios', verificaADM, async (req, res) => {
    try {
        const usuarios = await userModel.find({}, '-senha');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
 
// Criar usuário
router.post('/usuarios', verificaADM, async (req, res) => {
    try {
        const novoUser = new userModel({
            nome: req.body.nome,
            senha: req.body.senha,
            role: req.body.role || 'user'
        });
        await novoUser.save();
        res.status(201).json({ message: 'Usuario criado com sucesso!' });
    } catch (error) {
        res.status(400).json({ message: 'Erro ao criar usuario: ' + error.message });
    }
});
 
// Editar usuário (nome, senha ou role)
router.patch('/usuarios/:id', verificaADM, async (req, res) => {
    try {
        const result = await userModel.findByIdAndUpdate(
            req.params.id, req.body, { new: true }
        );
        res.json({ message: 'Usuario atualizado!', usuario: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
 
// Remover usuário
router.delete('/usuarios/:id', verificaADM, async (req, res) => {
    try {
        await userModel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Usuario removido!' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
