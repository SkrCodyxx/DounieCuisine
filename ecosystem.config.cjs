// ========================================
// PM2 ECOSYSTEM CONFIG - TEMPLATE
// ========================================
// ⚠️  NE PAS COMMITTER AVEC DES SECRETS RÉELS ⚠️
//
// RECOMMANDATION: Utilisez plutôt le fichier .env pour les secrets
// PM2 chargera automatiquement les variables depuis .env
//
// Ce fichier peut être simplifié pour ne contenir que la configuration
// sans les secrets, en s'appuyant sur le fichier .env

module.exports = {
  apps: [{
    name: 'dounie-cuisine',
    script: 'dist/index.js',
    cwd: '/var/www/dounie-cuisine',
    instances: 1,  // 1 instance pour éviter problème sessions (temporaire)
    exec_mode: 'fork',     // Mode fork pour sessions partagées
    autorestart: true,
    watch: false,
    max_memory_restart: '600M',  // 600M pour instance unique
    // OPTIMISATIONS CPU/RAM
    node_args: [
      '--max-old-space-size=1024',  // Limite la heap Node.js à 1GB
      '--optimize-for-size',        // Optimise pour l'utilisation mémoire
      '--gc-interval=100'          // Garbage collection plus fréquent
    ],
    env_file: '/var/www/dounie-cuisine/.env',
    env: {
      NODE_ENV: 'production', // Mode production pour mise en ligne
      BEHIND_PROXY: 'true',    // Indique qu'on est derrière nginx
      PORT: '5000',
      // OPTIMISATIONS NODE.JS
      UV_THREADPOOL_SIZE: 4,       // Limite les threads (défaut: 4, max recommandé pour 4GB)
      NODE_OPTIONS: '--max-old-space-size=1024'
    },
    // Logs optimisés pour réduire I/O
    error_file: '/var/www/dounie-cuisine/logs/pm2-error.log',
    out_file: '/var/www/dounie-cuisine/logs/pm2-out.log', 
    log_file: '/var/www/dounie-cuisine/logs/pm2-combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Rotation des logs pour éviter des fichiers trop gros
    log_type: 'json',
    max_restarts: 5,
    min_uptime: '10s'
  }]
}

