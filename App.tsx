
import React, { useState, useEffect } from 'react';
import { View, Photo, PhotoBook, Order } from './types';
import { IconPlus, IconBookOpen, IconChevronRight, IconTrash, IconEdit, IconCheck, IconSparkles, IconLoader, IconHeart, IconLogo } from './components/Icons';
import { generateCaption, generateTitleSuggestions } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [userPhotos, setUserPhotos] = useState<Photo[]>([]);
  const [projects, setProjects] = useState<PhotoBook[]>([]);
  const [currentProject, setCurrentProject] = useState<PhotoBook | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    recipient: "Partner/in",
    recipientName: "",
    senderName: "",
    title: "",
    writingStyle: "Modern & direkt",
    recipientPhoto: null as string | null
  });
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);

  useEffect(() => {
    const savedProjects = localStorage.getItem('storyprint_projects');
    if (savedProjects) setProjects(JSON.parse(savedProjects));
  }, []);

  useEffect(() => {
    localStorage.setItem('storyprint_projects', JSON.stringify(projects));
  }, [projects]);

  const navigate = (view: View) => {
    setCurrentView(view);
    if (view === View.WIZARD) setWizardStep(1);
  };

  const createNewProject = () => {
    const pages = Array.from({ length: 10 }, (_, i) => ({
      id: `page-${i}`,
      layout: 'single' as const,
      caption: '',
      photoId: undefined as string | undefined
    }));

    let newPhotos = [...userPhotos];
    
    // If a recipient photo was uploaded in the wizard, add it to library and set as first page
    if (wizardData.recipientPhoto) {
      const recipientPhotoId = `recipient-${Math.random().toString(36).substr(2, 5)}`;
      const recipientPhotoObj: Photo = {
        id: recipientPhotoId,
        url: wizardData.recipientPhoto,
        name: `Portrait ${wizardData.recipientName}`
      };
      newPhotos = [recipientPhotoObj, ...userPhotos];
      setUserPhotos(newPhotos);
      pages[0].photoId = recipientPhotoId;
      pages[0].caption = `Das ist ${wizardData.recipientName}`;
    }

    const newProject: PhotoBook = {
      id: Math.random().toString(36).substr(2, 9),
      title: wizardData.title || "Mein Herzensbuch",
      theme: "modern",
      size: 'Square',
      writingStyle: wizardData.writingStyle,
      pages: pages,
      status: 'draft'
    };
    
    setProjects([newProject, ...projects]);
    setCurrentProject(newProject);
    navigate(View.EDITOR);
    setActivePageIndex(0);
  };

  const updatePage = (photoId?: string, caption?: string) => {
    if (!currentProject) return;
    const newPages = [...currentProject.pages];
    newPages[activePageIndex] = {
      ...newPages[activePageIndex],
      photoId: photoId !== undefined ? photoId : newPages[activePageIndex].photoId,
      caption: caption !== undefined ? caption : newPages[activePageIndex].caption
    };
    const updatedProject = { ...currentProject, pages: newPages };
    setCurrentProject(updatedProject);
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleAiCaption = async () => {
    if (!currentProject || !currentProject.pages[activePageIndex].photoId) return;
    const photo = userPhotos.find(p => p.id === currentProject.pages[activePageIndex].photoId);
    if (!photo) return;

    setIsAiLoading(true);
    const caption = await generateCaption(photo.url, currentProject.writingStyle);
    updatePage(undefined, caption);
    setIsAiLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newPhoto: Photo = {
          id: Math.random().toString(36).substr(2, 9),
          url: ev.target?.result as string,
          name: file.name
        };
        setUserPhotos(prev => [newPhoto, ...prev]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRecipientPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setWizardData({ ...wizardData, recipientPhoto: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const placeOrder = (address: string) => {
    if (!currentProject) return;
    const newOrder: Order = {
      id: `ORD-${Math.random().toString(36).toUpperCase().substr(2, 6)}`,
      bookId: currentProject.id,
      createdAt: Date.now(),
      status: 'pending',
      address
    };
    setOrders([newOrder, ...orders]);
    const updatedProject: PhotoBook = { ...currentProject, status: 'ordered' };
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    navigate(View.STATUS);
  };

  // Views Rendering
  const renderLanding = () => (
    <div className="flex flex-col min-h-screen selection:bg-rose-100 selection:text-rose-900">
      {/* Top Info Banner */}
      <div className="bg-rose-600 text-white text-[11px] py-2 px-4 text-center font-black uppercase tracking-widest">
        Dein perfektes Geschenk. -20% auf deine erste Bestellung <span className="opacity-80">&lt;3</span>
      </div>

      <header className="px-6 py-4 flex justify-between items-center bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <IconLogo className="text-rose-600" /> Herzensbücher
        </div>
        <button onClick={() => navigate(View.DASHBOARD)} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-colors">
          Projekte
        </button>
      </header>

      <main className="flex-1 px-6 pt-12 pb-24 text-center bg-gradient-to-b from-rose-50 to-white">
        {/* Decorative Button Element (Look only) */}
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-rose-100 text-rose-600 text-sm font-bold mb-10 shadow-[0_4px_12px_rgba(225,29,72,0.08)] cursor-default">
           <span className="text-rose-300">&lt;3</span> Momente die bleiben
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6 text-slate-900 leading-[1.05]">
          Drucke deine <br/><span className="text-rose-600">schönsten</span> Momente.
        </h1>
        <p className="text-lg text-slate-500 mb-12 max-w-lg mx-auto leading-relaxed font-medium">
          In nur 3 Minuten vom Foto zum fertigen Herzensbuch. <br className="hidden sm:block"/>
          KI-gestützt, hochwertig und mit ganz viel Liebe gedruckt.
        </p>
        
        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={() => navigate(View.WIZARD)}
            className="bg-rose-600 text-white px-10 py-5 rounded-[2rem] text-lg font-black uppercase tracking-widest shadow-2xl shadow-rose-200 flex items-center gap-3 hover:bg-rose-700 hover:scale-105 transition-all active:scale-95 group"
          >
            Jetzt Buch erstellen <IconChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          {/* Trust Indicators */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-widest">
              <span className="text-slate-300">shopvote</span>
              <div className="flex gap-1 text-[14px] -mt-0.5">
                {[1,2,3,4].map(i => <span key={i} className="text-rose-400 leading-none">★</span>)}
                <span className="text-slate-200 leading-none">★</span>
              </div>
              <span className="border-l border-slate-100 pl-3">sicher shoppen</span>
            </div>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { title: "Smart Layout", desc: "Unsere KI ordnet deine Fotos perfekt an.", icon: <IconSparkles className="text-rose-400" /> },
              { title: "Premium Qualität", desc: "Hochwertiges Papier & brillanter Druck.", icon: <IconHeart className="text-rose-400 fill-rose-50" /> },
              { title: "Schneller Versand", desc: "In 3-5 Werktagen bei dir zu Hause.", icon: <IconBookOpen className="text-rose-400" /> }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-50 flex flex-col items-center group hover:shadow-xl hover:shadow-rose-100 transition-all duration-500">
                <div className="w-14 h-14 rounded-3xl bg-rose-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-black text-slate-800 mb-3 uppercase tracking-widest text-xs">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
        </div>
      </main>

      <footer className="py-10 text-center text-[10px] font-black uppercase tracking-widest text-slate-300 border-t border-rose-50">
        &copy; 2025 Herzensbücher &middot; Mit &lt;3 gemacht
      </footer>
    </div>
  );

  const renderDashboard = () => (
    <div className="min-h-screen bg-rose-50/20">
      <header className="px-6 py-4 flex justify-between items-center bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(View.LANDING)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors"><IconChevronRight className="rotate-180" /></button>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Meine Projekte</h2>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 font-black shadow-inner">M</div>
      </header>
      <main className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <button 
            onClick={() => navigate(View.WIZARD)}
            className="aspect-[3/4] border-2 border-dashed border-rose-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 hover:border-rose-400 hover:bg-rose-50 transition-all text-slate-400 hover:text-rose-600 group shadow-sm bg-white"
          >
            <div className="p-4 bg-rose-50 group-hover:bg-rose-100 rounded-3xl transition-all group-hover:scale-110">
              <IconPlus className="text-rose-600 w-6 h-6" />
            </div>
            <span className="font-black uppercase tracking-widest text-[10px]">Neues Buch</span>
          </button>
          {projects.map(project => (
            <div key={project.id} className="bg-white rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-rose-50 overflow-hidden flex flex-col group hover:shadow-lg transition-all">
              <div className="flex-1 bg-rose-50/50 flex items-center justify-center p-6 relative">
                <IconHeart className="text-rose-100 w-16 h-16 transition-transform group-hover:scale-125" />
                <div className="absolute inset-0 bg-rose-600/0 group-hover:bg-rose-600/5 transition-all"></div>
              </div>
              <div className="p-6">
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-800 truncate mb-2">{project.title}</h3>
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-rose-300 tracking-widest uppercase italic">{project.status}</span>
                   <button 
                    onClick={() => { setCurrentProject(project); navigate(View.EDITOR); }}
                    className="p-2 bg-rose-50 rounded-2xl text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                   >
                     <IconEdit className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {orders.length > 0 && (
          <div className="mt-16">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-rose-300 mb-6 flex items-center gap-3">
              <span className="h-0.5 w-4 bg-rose-100"></span> Deine Bestellungen
            </h3>
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} onClick={() => navigate(View.STATUS)} className="bg-white p-6 rounded-[1.5rem] border border-rose-50 flex justify-between items-center cursor-pointer hover:bg-rose-50 transition-all shadow-sm group">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-400 font-black group-hover:bg-white transition-colors">#</div>
                    <div>
                      <div className="font-black text-sm text-slate-800 group-hover:text-rose-600 transition-colors tracking-tight">{order.id}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
                    {order.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );

  const renderWizard = () => {
    const recipients = ["Partner/in", "Freund/in", "Mama/Papa", "Schwester/Bruder", "Tochter/Sohn"];
    const writingStyles = [
      "Romantisch & Gefühlvoll",
      "Verspielt & Leicht",
      "Ruhig & Poetisch",
      "Modern & direkt"
    ];
    
    const nextStep = async () => {
      if (wizardStep === 3) {
        setIsGeneratingTitles(true);
        const titles = await generateTitleSuggestions(wizardData.recipient, wizardData.recipientName, wizardData.senderName);
        setTitleSuggestions(titles);
        setIsGeneratingTitles(false);
      }
      setWizardStep(prev => prev + 1);
    };

    const prevStep = () => {
      if (wizardStep > 1) setWizardStep(prev => prev - 1);
      else navigate(View.LANDING);
    };

    return (
      <div className="min-h-screen bg-white flex flex-col p-8 max-w-md mx-auto">
        <header className="flex justify-between items-center mb-16">
          <button onClick={prevStep} className="p-2 -ml-2 text-slate-200 hover:text-rose-500 transition-colors"><IconChevronRight className="rotate-180" /></button>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`h-1.5 w-6 rounded-full transition-all duration-500 ${wizardStep >= i ? 'bg-rose-600 w-8' : 'bg-rose-50'}`} />
            ))}
          </div>
          <div className="w-10"></div>
        </header>

        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
          {wizardStep === 1 && (
            <div className="space-y-8">
              <div className="text-rose-600 font-black text-xs uppercase tracking-[0.3em]">
                Schritt 1
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">Für wen ist <br/>das Buch?</h2>
              <div className="relative group">
                <select 
                  value={wizardData.recipient}
                  onChange={(e) => setWizardData({...wizardData, recipient: e.target.value})}
                  className="w-full appearance-none bg-rose-50 border-2 border-rose-100 rounded-[2rem] px-8 py-7 outline-none focus:ring-4 focus:ring-rose-100 text-lg font-black text-rose-900 shadow-sm transition-all"
                >
                  {recipients.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-rose-300">
                  <IconChevronRight className="rotate-90" />
                </div>
              </div>
              <button onClick={nextStep} className="w-full bg-rose-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-rose-200 active:scale-95 transition-all mt-6">Weiter</button>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-8">
              <div className="text-rose-600 font-black text-xs uppercase tracking-[0.3em]">
                Schritt 2
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">Wie heißt die <br/>Person?</h2>
              <input 
                autoFocus
                type="text"
                placeholder="Name eingeben"
                value={wizardData.recipientName}
                onChange={(e) => setWizardData({...wizardData, recipientName: e.target.value})}
                className="w-full bg-rose-50 border-2 border-rose-100 rounded-[2rem] px-8 py-7 outline-none focus:ring-4 focus:ring-rose-100 text-lg font-black text-rose-900 shadow-sm placeholder:text-rose-200 transition-all"
              />
              <button 
                disabled={!wizardData.recipientName}
                onClick={nextStep} 
                className="w-full bg-rose-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-rose-200 disabled:opacity-50 transition-all active:scale-95 mt-6"
              >
                Weiter
              </button>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-8">
              <div className="text-rose-600 font-black text-xs uppercase tracking-[0.3em]">
                Schritt 3
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">Und wie <br/>heißt du?</h2>
              <input 
                autoFocus
                type="text"
                placeholder="Dein Name"
                value={wizardData.senderName}
                onChange={(e) => setWizardData({...wizardData, senderName: e.target.value})}
                className="w-full bg-rose-50 border-2 border-rose-100 rounded-[2rem] px-8 py-7 outline-none focus:ring-4 focus:ring-rose-100 text-lg font-black text-rose-900 shadow-sm placeholder:text-rose-200 transition-all"
              />
              <button 
                disabled={!wizardData.senderName}
                onClick={nextStep} 
                className="w-full bg-rose-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-rose-200 disabled:opacity-50 transition-all active:scale-95 mt-6"
              >
                Titel finden
              </button>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="space-y-8">
              <div className="text-rose-600 font-black text-xs uppercase tracking-[0.3em]">
                Schritt 4
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">Buchtitel <br/>wählen</h2>
              <div className="space-y-4">
                {isGeneratingTitles ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-20 w-full bg-rose-50 animate-pulse rounded-[1.5rem]" />
                  ))
                ) : (
                  titleSuggestions.map((suggestion, i) => (
                    <button 
                      key={i}
                      onClick={() => setWizardData({...wizardData, title: suggestion})}
                      className={`w-full p-7 rounded-[2rem] border-2 text-left transition-all duration-300 ${wizardData.title === suggestion ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-xl font-black' : 'border-rose-50 hover:border-rose-200 text-slate-600 font-bold'}`}
                    >
                      {suggestion}
                    </button>
                  ))
                )}
              </div>
              
              <div className="pt-6">
                <label className="block text-[10px] font-black text-rose-300 uppercase mb-3 ml-6 tracking-[0.3em]">Oder eigener Titel</label>
                <input 
                  type="text"
                  placeholder="Eigener Titel"
                  value={wizardData.title}
                  onChange={(e) => setWizardData({...wizardData, title: e.target.value})}
                  className="w-full bg-white border-2 border-rose-100 rounded-[2rem] px-8 py-6 outline-none focus:ring-4 focus:ring-rose-100 text-lg font-black text-slate-700 shadow-sm"
                />
              </div>

              <button 
                disabled={!wizardData.title}
                onClick={nextStep}
                className="w-full bg-rose-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-rose-200 disabled:opacity-50 transition-all active:scale-95 mt-4"
              >
                Weiter
              </button>
            </div>
          )}

          {wizardStep === 5 && (
            <div className="space-y-8">
              <div className="text-rose-600 font-black text-xs uppercase tracking-[0.3em]">
                Schritt 5
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">Schreibstil <br/>wählen</h2>
              <p className="text-slate-500 font-medium -mt-4">Wie sollen die Bildunterschriften klingen?</p>
              
              <div className="grid grid-cols-1 gap-4">
                {writingStyles.map((style, i) => (
                  <button 
                    key={i}
                    onClick={() => setWizardData({...wizardData, writingStyle: style})}
                    className={`w-full p-7 rounded-[2rem] border-2 text-left transition-all duration-300 ${wizardData.writingStyle === style ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-xl font-black' : 'border-rose-50 hover:border-rose-200 text-slate-600 font-bold'}`}
                  >
                    {style}
                  </button>
                ))
                }
              </div>

              <button 
                onClick={nextStep}
                className="w-full bg-rose-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-rose-200 transition-all active:scale-95 mt-6"
              >
                Foto hochladen
              </button>
            </div>
          )}

          {wizardStep === 6 && (
            <div className="space-y-8">
              <div className="text-rose-600 font-black text-xs uppercase tracking-[0.3em]">
                Schritt 6
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">Ein Bild <br/>von {wizardData.recipientName}</h2>
              
              <div className="flex flex-col items-center justify-center">
                <label className={`w-full aspect-[4/5] rounded-[3rem] border-4 border-dashed transition-all duration-500 flex flex-col items-center justify-center cursor-pointer overflow-hidden ${wizardData.recipientPhoto ? 'border-rose-600 bg-rose-50 shadow-2xl' : 'border-rose-100 bg-rose-50/20 hover:bg-rose-50'}`}>
                  {wizardData.recipientPhoto ? (
                    <img src={wizardData.recipientPhoto} className="w-full h-full object-cover" alt="Portrait" />
                  ) : (
                    <div className="flex flex-col items-center text-rose-200">
                      <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-lg mb-6">
                        <IconPlus className="w-10 h-10 text-rose-600" />
                      </div>
                      <span className="font-black text-lg uppercase tracking-widest text-rose-300">Foto wählen</span>
                    </div>
                  )}
                  <input type="file" hidden accept="image/*" onChange={handleRecipientPhotoUpload} />
                </label>
                
                {wizardData.recipientPhoto && (
                  <button 
                    onClick={() => setWizardData({...wizardData, recipientPhoto: null})}
                    className="mt-6 text-rose-300 font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:text-rose-600 transition-colors"
                  >
                    <IconTrash className="w-4 h-4" /> Entfernen
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-4 pt-6">
                <button 
                  onClick={createNewProject}
                  className="w-full bg-rose-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-rose-200 transition-all active:scale-95"
                >
                  {wizardData.recipientPhoto ? "Buch erstellen" : "Ohne Foto fortfahren"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEditor = () => {
    if (!currentProject) return null;
    const activePage = currentProject.pages[activePageIndex];
    const selectedPhoto = userPhotos.find(p => p.id === activePage.photoId);

    return (
      <div className="flex flex-col h-screen bg-rose-50/10">
        <header className="px-6 py-4 flex justify-between items-center bg-white border-b shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(View.DASHBOARD)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors"><IconChevronRight className="rotate-180" /></button>
            <div className="flex flex-col">
              <h2 className="font-black text-[10px] uppercase tracking-[0.3em] text-rose-600">{currentProject.title}</h2>
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">S. {activePageIndex + 1} / {currentProject.pages.length}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate(View.CHECKOUT)}
              className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white rounded-full bg-rose-600 shadow-lg shadow-rose-100 active:scale-95 transition-all hover:bg-rose-700"
            >
              Bestellen
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="order-2 md:order-1 h-32 md:h-full md:w-64 bg-white border-t md:border-t-0 md:border-r overflow-x-auto md:overflow-y-auto no-scrollbar shadow-inner">
            <div className="flex md:flex-col p-6 gap-6">
              {currentProject.pages.map((page, idx) => (
                <button 
                  key={page.id}
                  onClick={() => setActivePageIndex(idx)}
                  className={`flex-shrink-0 relative rounded-2xl overflow-hidden border-2 transition-all duration-500 ${activePageIndex === idx ? 'border-rose-600 ring-4 ring-rose-50 shadow-2xl scale-105 z-10' : 'border-rose-50 opacity-50 hover:opacity-100 hover:scale-102'}`}
                >
                  <div className="w-16 h-20 md:w-full md:aspect-[3/4] bg-rose-50/20 flex items-center justify-center relative">
                    {page.photoId ? (
                      <img src={userPhotos.find(p => p.id === page.photoId)?.url} className="w-full h-full object-cover" />
                    ) : (
                      <IconPlus className="text-rose-100" />
                    )}
                    <div className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded-lg text-[8px] font-black text-rose-600 shadow-sm">{idx + 1}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="order-1 md:order-2 flex-1 p-8 flex items-center justify-center overflow-auto">
            <div className="w-full max-w-sm aspect-[3/4] bg-white shadow-[0_40px_80px_-15px_rgba(225,29,72,0.1)] rounded-md flex flex-col p-10 relative">
              <div className="flex-1 bg-rose-50/10 rounded-xl border-2 border-dashed border-rose-50 flex items-center justify-center overflow-hidden relative group">
                {selectedPhoto ? (
                  <>
                    <img src={selectedPhoto.url} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => updatePage(null as any)} 
                      className="absolute top-4 right-4 p-3 bg-rose-600 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-2xl hover:scale-110 active:scale-95"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center text-rose-200 p-8 text-center group-hover:text-rose-500 transition-all">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-6 group-hover:scale-110 transition-transform">
                      <IconPlus className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Foto einfügen</span>
                    <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                  </label>
                )}
              </div>
              <div className="mt-10">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-black text-rose-200 tracking-[0.4em]">Caption</span>
                    <span className="text-[9px] text-rose-300 italic -mt-0.5 font-bold">{currentProject.writingStyle}</span>
                  </div>
                  {selectedPhoto && (
                    <button 
                      onClick={handleAiCaption}
                      disabled={isAiLoading}
                      className="text-[9px] flex items-center gap-2 text-rose-600 font-black px-4 py-2 rounded-full bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-all shadow-sm active:scale-95"
                    >
                      {isAiLoading ? <IconLoader /> : <><IconSparkles className="w-3.5 h-3.5" /> KI Vorschlag</>}
                    </button>
                  )}
                </div>
                <textarea 
                  value={activePage.caption}
                  onChange={(e) => updatePage(undefined, e.target.value)}
                  placeholder="Deine Erinnerung hier..."
                  className="w-full h-24 text-sm font-bold leading-relaxed resize-none border-none outline-none placeholder:text-rose-50 focus:ring-0 text-slate-700 bg-transparent"
                />
              </div>
              <div className="absolute bottom-4 right-10 flex gap-1">
                 <IconHeart className="w-2.5 h-2.5 fill-rose-50" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-t p-6 h-56 overflow-hidden flex flex-col shadow-[0_-15px_30px_rgba(225,29,72,0.03)]">
          <div className="flex justify-between items-center mb-5">
             <span className="text-[9px] font-black text-rose-300 uppercase tracking-[0.4em]">Bibliothek</span>
             <label className="cursor-pointer text-[10px] text-rose-600 font-black flex items-center gap-3 hover:bg-rose-50 px-5 py-3 rounded-[1.5rem] transition-all border border-rose-100 shadow-sm uppercase tracking-widest">
               <IconPlus className="w-4 h-4" /> Upload
               <input type="file" multiple hidden accept="image/*" onChange={handleFileUpload} />
             </label>
          </div>
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4">
             {userPhotos.map(photo => (
               <button 
                key={photo.id} 
                onClick={() => updatePage(photo.id)}
                className="w-28 h-28 flex-shrink-0 rounded-[2rem] overflow-hidden border-2 border-transparent hover:border-rose-600 active:scale-95 transition-all shadow-xl group"
               >
                 <img src={photo.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
               </button>
             ))}
             {userPhotos.length === 0 && (
               <div className="w-full flex flex-col items-center justify-center py-8 border-2 border-dashed border-rose-50 rounded-[2rem] bg-rose-50/10">
                  <p className="text-rose-100 text-[10px] font-black uppercase tracking-[0.4em] italic">Keine Fotos geladen</p>
               </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  const renderCheckout = () => {
    const [address, setAddress] = useState("");
    return (
      <div className="min-h-screen bg-rose-50/10 flex flex-col">
        <header className="px-6 py-8 flex items-center bg-white border-b shadow-sm">
          <button onClick={() => navigate(View.EDITOR)} className="mr-6 text-rose-500 hover:scale-110 transition-transform"><IconChevronRight className="rotate-180" /></button>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Deine Bestellung</h2>
        </header>
        <main className="flex-1 p-6">
          <div className="max-w-md mx-auto space-y-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-rose-100/20 border border-rose-50">
               <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-rose-300 mb-8">Zusammenfassung</h3>
               <div className="flex justify-between text-sm mb-4">
                 <span className="text-slate-500 font-bold">Herzensbuch "{currentProject?.title}"</span>
                 <span className="font-black text-slate-800">29,90 €</span>
               </div>
               <div className="flex justify-between text-sm mb-8">
                 <span className="text-slate-500 font-bold">Versand</span>
                 <span className="font-black text-rose-500 uppercase text-[10px] tracking-widest">Kostenlos &lt;3</span>
               </div>
               <div className="border-t border-rose-50 pt-8 flex justify-between items-center">
                 <span className="font-black text-slate-300 uppercase text-[10px] tracking-widest">Gesamt</span>
                 <span className="font-black text-rose-600 text-3xl tracking-tighter">29,90 €</span>
               </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-rose-100/20 border border-rose-50">
              <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-rose-300 mb-8">Lieferadresse</h3>
              <textarea 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Vorname Nachname&#10;Straße Hausnummer&#10;PLZ Stadt"
                className="w-full h-36 p-8 bg-rose-50/20 rounded-[2rem] border-none focus:ring-4 focus:ring-rose-50 outline-none text-sm font-bold placeholder:text-rose-100 transition-all"
              />
            </div>

            <button 
              disabled={!address}
              onClick={() => placeOrder(address)}
              className="w-full bg-rose-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl shadow-rose-200 hover:bg-rose-700 hover:scale-102 transition-all disabled:opacity-50 active:scale-95"
            >
              Jetzt mit Liebe bestellen
            </button>
          </div>
        </main>
      </div>
    );
  };

  const renderStatus = () => {
    const latestOrder = orders[0];
    if (!latestOrder) return null;

    const steps = [
      { key: 'pending', label: 'Eingegangen', icon: <IconHeart className="fill-white" /> },
      { key: 'printing', label: 'Wird gedruckt', icon: <IconBookOpen /> },
      { key: 'shipped', label: 'Versendet', icon: <IconChevronRight /> },
      { key: 'delivered', label: 'Zugestellt', icon: <IconSparkles /> }
    ];

    return (
      <div className="min-h-screen bg-white p-10 flex flex-col items-center justify-center text-center">
        <div className="w-28 h-28 bg-rose-50 text-rose-600 rounded-[3rem] flex items-center justify-center mb-10 shadow-2xl shadow-rose-100 scale-in-center border-2 border-rose-100 hover:scale-110 transition-transform">
           <IconHeart className="w-12 h-12 fill-rose-600" />
        </div>
        <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter leading-none">Vielen Dank <span className="text-rose-600">&lt;3</span></h2>
        <p className="text-slate-400 mb-16 max-w-xs leading-relaxed font-bold">Deine Bestellung <span className="text-rose-600">{latestOrder.id}</span> wird mit ganz viel Herz bearbeitet.</p>
        
        <div className="w-full max-w-sm space-y-12 text-left">
          {steps.map((step, i) => {
            const isCompleted = i === 0;
            return (
              <div key={step.key} className="flex gap-8 items-start relative">
                {i < steps.length - 1 && <div className="absolute left-[1.4rem] top-14 w-1 h-14 bg-rose-50/50 rounded-full"></div>}
                <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center z-10 transition-all duration-1000 ${isCompleted ? 'bg-rose-600 text-white shadow-2xl shadow-rose-200 scale-125' : 'bg-rose-50 text-rose-100'}`}>
                   {step.icon}
                </div>
                <div className="pt-2">
                   <h4 className={`font-black uppercase tracking-[0.3em] text-[10px] ${isCompleted ? 'text-rose-600' : 'text-rose-100'}`}>{step.label}</h4>
                   <p className="text-sm font-black text-slate-400 mt-1">{isCompleted ? 'Deine Bestellung ist bei uns.' : 'Wird vorbereitet.'}</p>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={() => navigate(View.DASHBOARD)}
          className="mt-24 text-rose-600 font-black text-[10px] uppercase tracking-[0.4em] border-b-4 border-rose-50 pb-3 hover:border-rose-600 transition-all"
        >
          Zurück zu deinen Projekten
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-[100vw] overflow-x-hidden font-inter selection:bg-rose-100 selection:text-rose-900">
      {currentView === View.LANDING && renderLanding()}
      {currentView === View.DASHBOARD && renderDashboard()}
      {currentView === View.WIZARD && renderWizard()}
      {currentView === View.EDITOR && renderEditor()}
      {currentView === View.CHECKOUT && renderCheckout()}
      {currentView === View.STATUS && renderStatus()}
    </div>
  );
};

export default App;
