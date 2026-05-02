import React from 'react';
import { BrowserRouter, Routes, Route, useParams, useLocation } from 'react-router-dom';
import { MateriaComposer } from './components/MateriaComposer';
import { ForgeMaster } from './components/Forge/ForgeMaster';
import { useSovereign } from '../score/SovereignContext';

/**
 * 🛰️ VIEW PROJECTOR (Fase 4)
 * Escucha la URL y proyecta la entidad VIEW_PROJECTION correspondiente.
 */
const ViewProjector = () => {
    const location = useLocation();
    const { state, loading } = useSovereign();
    
    if (loading) return <div className="void-state">SINTONIZANDO PROYECCIÓN...</div>;

    // Buscamos una VIEW_PROJECTION que coincida con el path actual
    const views = state.materia['VIEW_PROJECTIONS'] || [];
    const activeView = views.find(v => v.data?.path === location.pathname);

    if (!activeView) {
        return (
            <div className="void-state">
                <h1>404 | DIMENSIÓN NO PROYECTADA</h1>
                <p>No existe una VIEW_PROJECTION definida para <b>{location.pathname}</b>.</p>
                <a href="/forge" className="back-link">CONFIGURAR VISTA EN LA FORJA</a>
            </div>
        );
    }

    return (
        <div className="materia-container">
            <MateriaComposer blocks={activeView.data?.composition || []} />
        </div>
    );
};

export const SovereignRouter = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/forge" element={<ForgeMaster />} />
            {/* Catch-all: Cualquier otra ruta es una proyección dinámica */}
            <Route path="*" element={<ViewProjector />} />
        </Routes>
    </BrowserRouter>
);
