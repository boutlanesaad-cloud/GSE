# ============================================================================
# GSE AUDIT PRO - Application d'Audit des Équipements de Support au Sol
# ============================================================================

# 1. IMPORTATIONS ET CONFIGURATION
import streamlit as st
import sqlite3
import pandas as pd
import plotly.express as px
import json
from datetime import datetime, date

# Configuration de la page
st.set_page_config(page_title="GSE Audit Pro", layout="wide")

# ============================================================================
# 2. BASE DE DONNÉES ET INSERTION DES DONNÉES
# ============================================================================

def init_db():
    """Initialise la base de données SQLite avec les 3 tables"""
    conn = sqlite3.connect("gse.db")
    cursor = conn.cursor()
    
    # Table types_equipement
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS types_equipement (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT,
            age_max INTEGER
        )
    """)
    
    # Table equipements
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS equipements (
            ref TEXT PRIMARY KEY,
            type_id INTEGER,
            age TEXT,
            statut TEXT,
            FOREIGN KEY (type_id) REFERENCES types_equipement(id)
        )
    """)
    
    # Table inspections
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inspections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ref_equipement TEXT,
            date_inspection TEXT,
            statut_conformite TEXT,
            observations TEXT,
            FOREIGN KEY (ref_equipement) REFERENCES equipements(ref)
        )
    """)
    
    conn.commit()
    conn.close()


def insert_mock_data():
    """Insère les données de démonstration si la table equipements est vide"""
    conn = sqlite3.connect("gse.db")
    cursor = conn.cursor()
    
    # Vérifier si la table equipements est vide
    cursor.execute("SELECT COUNT(*) FROM equipements")
    count = cursor.fetchone()[0]
    
    if count == 0:
        # Données JSON fournies
        data_json = [
            {"type": "Air Start Unit", "age_max": 10, "unites": [{"ref": "2239", "age": "17 ans", "statut": "Actif", "obs": ["Non conforme (Age dépassé)", "Extincteur non étiqueté", "Dégradation et sous-pression des pneumatiques", "Macaron expiré"]}, {"ref": "2231", "age": "21 ans", "statut": "Actif", "obs": ["Non conforme (Age dépassé)", "Extincteur non étiqueté", "Sous-pression des pneumatiques", "Macaron expiré"]}]},
            {"type": "Push Back", "age_max": 10, "unites": [{"ref": "6690", "age": "7 ans", "statut": "Actif", "obs": ["Fauteuil du conducteur dégradé", "Necessité de nettoyage", "Dégradation des pneumatiques risque : perte de contrôle", "Macaron expiré"]}, {"ref": "6682", "age": "14 ans", "statut": "Inactif", "obs": ["Réformé"]}, {"ref": "6696", "age": "1 mois", "statut": "HS", "obs": ["Dégradation pneumatiques", "Macaron expiré", "Hors Service (fuites d'huiles)"]}]},
            {"type": "Tracteur De Piste", "age_max": 5, "unites": [{"ref": "6109", "age": "10 ans", "statut": "Actif", "obs": ["Non conforme (Age dépassé)", "Peinture dégradée", "Essuies Glaces Hors Service", "Manque rétroviseurs", "Absence des feux", "Macaron expiré"]}, {"ref": "6170", "age": "7 ans", "statut": "HS", "obs": ["Non conforme (Age dépassé)", "Fuite d'huile", "Flexible hydraulique HS", "Hors Service"]}, {"ref": "6045", "age": "2 ans", "statut": "Actif", "obs": ["Peinture Dégradée", "Manque rétroviseurs", "Extincteur non étiqueté", "Absence des feux", "Macaron expiré"]}, {"ref": "6028", "age": "Neuf", "statut": "Actif", "obs": ["Electrique", "Nouveau"]}]},
            {"type": "Tapis Bagage", "age_max": 10, "unites": [{"ref": "6818", "age": "11 ans", "statut": "Actif", "obs": ["Non conforme (Age dépassé)", "Fuite d'huile", "Bandes de protection dégradées", "Macaron expiré"]}, {"ref": "6834", "age": "4 ans", "statut": "Actif", "obs": ["Manque rétroviseurs", "Extincteur non étiqueté", "Etat du pneu dégradé", "Macaron expiré"]}, {"ref": "6793", "age": "13 ans", "statut": "Actif", "obs": ["Non conforme (Age dépassé)", "Gyrophare Hors Service", "Risque de rupture tapis", "Macaron expiré"]}]},
            {"type": "Groupe Electrogène", "age_max": 10, "unites": [{"ref": "2108", "age": "10 ans", "statut": "Actif", "obs": ["Non conforme (Age dépassé)", "Peinture dégradée", "Macaron expiré"]}, {"ref": "2134", "age": "3 ans", "statut": "Actif", "obs": ["Gyrophare Hors Service", "Extincteur non conforme", "Macaron expiré"]}, {"ref": "2055", "age": "14 ans", "statut": "HS", "obs": ["Non conforme (Age dépassé)", "Fuites huile", "Hors Service"]}]},
            {"type": "Bus Passagers", "age_max": 5, "unites": [{"ref": "1049", "age": "2 ans", "statut": "Actif", "obs": ["Feux antibrouillard hors service", "Macaron expiré"]}, {"ref": "1098", "age": "4 ans", "statut": "HS", "obs": ["Pneu dégradé", "HORS SERVICE (Besoin pièce)"]}]},
            {"type": "Escabeaux Autotractes", "age_max": 5, "unites": [{"ref": "4656", "age": "11 ans", "statut": "Actif", "obs": ["Non conforme (Age dépassé)", "Fauteuil dégradé", "Pneu dégradé", "Macaron expiré"]}, {"ref": "4679", "age": "4 ans", "statut": "Actif", "obs": ["Macaron expiré"]}, {"ref": "4626", "age": "14 ans", "statut": "Actif", "obs": ["Non conforme (Age dépassé)", "Gard-corp non conforme", "Macaron expiré"]}]}
        ]
        
        # Insérer les types d'équipements
        for item in data_json:
            cursor.execute("INSERT INTO types_equipement (nom, age_max) VALUES (?, ?)", 
                          (item["type"], item["age_max"]))
        
        conn.commit()
        
        # Récupérer les IDs des types
        cursor.execute("SELECT id, nom FROM types_equipement")
        types_map = {row[1]: row[0] for row in cursor.fetchall()}
        
        # Insérer les équipements et inspections
        today = date.today().strftime("%Y-%m-%d")
        
        for item in data_json:
            type_id = types_map[item["type"]]
            
            for unite in item["unites"]:
                # Insérer l'équipement
                cursor.execute("INSERT INTO equipements (ref, type_id, age, statut) VALUES (?, ?, ?, ?)",
                              (unite["ref"], type_id, unite["age"], unite["statut"]))
                
                # Créer l'inspection
                if unite["obs"] and len(unite["obs"]) > 0:
                    statut_conformite = "Non Conforme"
                    observations = " | ".join(unite["obs"])
                else:
                    statut_conformite = "Conforme"
                    observations = ""
                
                cursor.execute("INSERT INTO inspections (ref_equipement, date_inspection, statut_conformite, observations) VALUES (?, ?, ?, ?)",
                              (unite["ref"], today, statut_conformite, observations))
        
        conn.commit()
    
    conn.close()


# Initialiser la base de données au démarrage
init_db()
insert_mock_data()

# ============================================================================
# 3. NAVIGATION
# ============================================================================

menu = st.sidebar.radio("Menu", [
    "📊 Dashboard",
    "📋 Inventaire & Inspection",
    "⚠️ Analyse de Risques",
    "🧮 Capacité Opérationnelle",
    "🎯 Plan d'Action"
])

# ============================================================================
# 4. PAGE "📊 Dashboard"
# ============================================================================

if menu == "📊 Dashboard":
    st.title("📊 Tableau de Bord GSE Audit Pro")
    st.markdown("---")
    
    # Connexion et chargement des données
    conn = sqlite3.connect("gse.db")
    
    # Charger les équipements
    df_equipements = pd.read_sql_query("""
        SELECT e.ref, e.age, e.statut, t.nom as type_nom, t.age_max
        FROM equipements e
        JOIN types_equipement t ON e.type_id = t.id
    """, conn)
    
    # Charger les inspections
    df_inspections = pd.read_sql_query("""
        SELECT ref_equipement, date_inspection, statut_conformite, observations
        FROM inspections
    """, conn)
    
    # Fusionner pour analyse
    df_merged = pd.merge(df_equipements, df_inspections, left_on="ref", right_on="ref_equipement", how="left")
    
    conn.close()
    
    # Calcul des KPIs
    equipements_actifs = df_equipements[df_equipements["statut"] == "Actif"]
    nb_actifs = len(equipements_actifs)
    
    equipements_hs = df_equipements[df_equipements["statut"] == "HS"]
    nb_hs = len(equipements_hs)
    
    inspections_non_conformes = df_inspections[df_inspections["statut_conformite"] == "Non Conforme"]
    nb_non_conformites = len(inspections_non_conformes)
    
    # Taux de conformité : % d'équipements 'Actif' qui sont 'Conforme' sur le total 'Actif'
    actifs_conformes = equipements_actifs.merge(
        df_inspections[df_inspections["statut_conformite"] == "Conforme"],
        left_on="ref", right_on="ref_equipement", how="inner"
    )
    nb_actifs_conformes = len(actifs_conformes)
    
    if nb_actifs > 0:
        taux_conformite = round((nb_actifs_conformes / nb_actifs) * 100, 1)
    else:
        taux_conformite = 0
    
    # Affichage des 4 metrics en colonnes
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(label="Taux de conformité", value=f"{taux_conformite}%", delta=None)
    
    with col2:
        st.metric(label="Equipements Actifs", value=nb_actifs, delta=None)
    
    with col3:
        st.metric(label="Equipements HS", value=nb_hs, delta=None)
    
    with col4:
        st.metric(label="Non-Conformités signalées", value=nb_non_conformites, delta=None)
    
    st.markdown("---")
    
    # Graphique Camembert - Répartition des statuts
    col_pie, col_bar = st.columns(2)
    
    with col_pie:
        st.subheader("🥧 Répartition des Statuts")
        df_statuts = df_equipements["statut"].value_counts().reset_index()
        df_statuts.columns = ["statut", "nombre"]
        
        fig_pie = px.pie(df_statuts, values="nombre", names="statut", 
                        color_discrete_sequence=px.colors.qualitative.Set2,
                        hole=0.4)
        fig_pie.update_layout(height=400)
        st.plotly_chart(fig_pie, use_container_width=True)
    
    with col_bar:
        st.subheader("📊 Top 5 Types avec Plus de Non-Conformités")
        
        # Compter les non-conformités par type
        df_nc_par_type = pd.merge(df_equipements, df_inspections, left_on="ref", right_on="ref_equipement")
        df_nc_par_type = df_nc_par_type[df_nc_par_type["statut_conformite"] == "Non Conforme"]
        df_nc_par_type = df_nc_par_type.groupby("type_nom").size().reset_index(name="nb_non_conformites")
        df_nc_par_type = df_nc_par_type.sort_values("nb_non_conformites", ascending=False).head(5)
        
        if len(df_nc_par_type) > 0:
            fig_bar = px.bar(df_nc_par_type, x="type_nom", y="nb_non_conformites",
                            labels={"type_nom": "Type d'équipement", "nb_non_conformites": "Nombre de non-conformités"},
                            color="nb_non_conformites",
                            color_continuous_scale="Reds")
            fig_bar.update_layout(height=400, xaxis_tickangle=-45)
            st.plotly_chart(fig_bar, use_container_width=True)
        else:
            st.info("Aucune non-conformité enregistrée")

# ============================================================================
# 5. PAGE "📋 Inventaire & Inspection"
# ============================================================================

elif menu == "📋 Inventaire & Inspection":
    st.title("📋 Inventaire & Inspection")
    st.markdown("---")
    
    conn = sqlite3.connect("gse.db")
    
    # Charger les données complètes
    df_complet = pd.read_sql_query("""
        SELECT e.ref, t.nom as type, e.age, e.statut, i.statut_conformite, i.observations, i.date_inspection
        FROM equipements e
        JOIN types_equipement t ON e.type_id = t.id
        LEFT JOIN inspections i ON e.ref = i.ref_equipement
    """, conn)
    
    conn.close()
    
    # Afficher le DataFrame complet
    st.subheader("📦 Inventaire Complet des Équipements")
    st.dataframe(df_complet, use_container_width=True)
    
    st.markdown("---")
    
    # SECTION AJOUT
    st.subheader("➕ Ajouter un nouvel équipement")
    
    with st.expander("➕ Ajouter un nouvel équipement"):
        # Récupérer la liste des types depuis la BDD
        conn = sqlite3.connect("gse.db")
        types_list = pd.read_sql_query("SELECT nom FROM types_equipement", conn)["nom"].tolist()
        conn.close()
        
        with st.form("form_ajout"):
            col_a1, col_a2 = st.columns(2)
            
            with col_a1:
                ref_ajout = st.text_input("Référence")
                age_ajout = st.text_input("Âge")
            
            with col_a2:
                type_ajout = st.selectbox("Type", options=types_list)
                statut_ajout = st.selectbox("Statut", options=["Actif", "HS", "Inactif"])
            
            submit_ajout = st.form_submit_button("Ajouter l'équipement")
            
            if submit_ajout:
                if ref_ajout and type_ajout:
                    conn = sqlite3.connect("gse.db")
                    cursor = conn.cursor()
                    
                    # Récupérer l'ID du type
                    cursor.execute("SELECT id FROM types_equipement WHERE nom = ?", (type_ajout,))
                    type_id = cursor.fetchone()[0]
                    
                    # Insérer l'équipement
                    cursor.execute("""
                        INSERT INTO equipements (ref, type_id, age, statut)
                        VALUES (?, ?, ?, ?)
                    """, (ref_ajout, type_id, age_ajout, statut_ajout))
                    
                    # Créer une inspection par défaut
                    today = date.today().strftime("%Y-%m-%d")
                    cursor.execute("""
                        INSERT INTO inspections (ref_equipement, date_inspection, statut_conformite, observations)
                        VALUES (?, ?, ?, ?)
                    """, (ref_ajout, today, "Conforme", ""))
                    
                    conn.commit()
                    conn.close()
                    
                    st.success("Équipement ajouté avec succès !")
                    st.rerun()
                else:
                    st.error("Veuillez remplir la Référence et le Type")
    
    st.markdown("---")
    
    # SECTION EDITION
    st.subheader("✏️ Modifier un équipement existant")
    
    with st.expander("✏️ Modifier un équipement existant"):
        conn = sqlite3.connect("gse.db")
        refs_list = pd.read_sql_query("SELECT ref FROM equipements ORDER BY ref", conn)["ref"].tolist()
        conn.close()
        
        ref_edit = st.selectbox("Choisir la Référence à modifier", options=refs_list)
        
        if ref_edit:
            conn = sqlite3.connect("gse.db")
            
            # Récupérer les infos actuelles
            df_edit = pd.read_sql_query("""
                SELECT e.ref, e.age, e.statut, t.nom as type
                FROM equipements e
                JOIN types_equipement t ON e.type_id = t.id
                WHERE e.ref = ?
            """, conn, params=(ref_edit,))
            
            conn.close()
            
            if len(df_edit) > 0:
                row = df_edit.iloc[0]
                
                with st.form("form_edit"):
                    col_e1, col_e2 = st.columns(2)
                    
                    with col_e1:
                        age_edit = st.text_input("Âge", value=row["age"])
                        statut_edit = st.selectbox("Statut", options=["Actif", "HS", "Inactif"], 
                                                   index=["Actif", "HS", "Inactif"].index(row["statut"]))
                    
                    with col_e2:
                        type_edit = st.text_input("Type", value=row["type"], disabled=True)
                        ref_display = st.text_input("Référence", value=row["ref"], disabled=True)
                    
                    submit_edit = st.form_submit_button("Mettre à jour")
                    
                    if submit_edit:
                        conn = sqlite3.connect("gse.db")
                        cursor = conn.cursor()
                        
                        # Récupérer l'ID du type
                        cursor.execute("SELECT id FROM types_equipement WHERE nom = ?", (row["type"],))
                        type_id = cursor.fetchone()[0]
                        
                        # Mettre à jour l'équipement
                        cursor.execute("""
                            UPDATE equipements
                            SET age = ?, statut = ?, type_id = ?
                            WHERE ref = ?
                        """, (age_edit, statut_edit, type_id, ref_edit))
                        
                        conn.commit()
                        conn.close()
                        
                        st.success("Équipement mis à jour !")
                        st.rerun()
    
    st.markdown("---")
    
    # SECTION DETAIL
    st.subheader("🔍 Voir détail des inspections")
    
    with st.expander("🔍 Voir détail des inspections pour un équipement"):
        conn = sqlite3.connect("gse.db")
        refs_insp = pd.read_sql_query("SELECT DISTINCT ref FROM equipements ORDER BY ref", conn)["ref"].tolist()
        conn.close()
        
        ref_detail = st.selectbox("Sélectionner un équipement", options=refs_insp, key="detail_select")
        
        if ref_detail:
            conn = sqlite3.connect("gse.db")
            
            # Récupérer la dernière inspection
            df_last_insp = pd.read_sql_query("""
                SELECT date_inspection, statut_conformite, observations
                FROM inspections
                WHERE ref_equipement = ?
                ORDER BY date_inspection DESC
                LIMIT 1
            """, conn, params=(ref_detail,))
            
            conn.close()
            
            if len(df_last_insp) > 0:
                row_insp = df_last_insp.iloc[0]
                
                st.write(f"**Référence :** {ref_detail}")
                st.write(f"**Date d'inspection :** {row_insp['date_inspection']}")
                st.write(f"**Statut de conformité :** {row_insp['statut_conformite']}")
                
                st.write("**Observations :**")
                if row_insp["observations"] and row_insp["observations"].strip():
                    obs_list = row_insp["observations"].split(" | ")
                    for obs in obs_list:
                        st.write(f"- {obs}")
                else:
                    st.write("- Aucune observation")

# ============================================================================
# 6. PAGE "⚠️ Analyse de Risques"
# ============================================================================

elif menu == "⚠️ Analyse de Risques":
    st.title("⚠️ Analyse de Risques - Matrice G×P×D")
    st.markdown("---")
    
    conn = sqlite3.connect("gse.db")
    
    # Récupérer toutes les inspections non conformes
    df_nc = pd.read_sql_query("""
        SELECT e.ref, t.nom as type, i.observations
        FROM inspections i
        JOIN equipements e ON i.ref_equipement = e.ref
        JOIN types_equipement t ON e.type_id = t.id
        WHERE i.statut_conformite = "Non Conforme"
    """, conn)
    
    conn.close()
    
    def calculer_criticite(observation):
        """
        Calcule la criticité basée sur le contenu de l'observation
        Retourne : (Gravité, Probabilité, Détectabilité, Criticité, Niveau)
        """
        obs_lower = observation.lower()
        
        # Règles de calcul
        if "pneu" in obs_lower or "frein" in obs_lower or "perte de contrôle" in obs_lower:
            G, P, D = 4, 3, 2
        elif "extincteur" in obs_lower or "feu" in obs_lower:
            G, P, D = 5, 2, 2
        elif "fuite" in obs_lower or "huile" in obs_lower or "hydraulique" in obs_lower:
            G, P, D = 4, 3, 3
        elif "macaron" in obs_lower or "peinture" in obs_lower:
            G, P, D = 2, 4, 1
        elif "âge" in obs_lower or "age" in obs_lower or "dépassé" in obs_lower:
            G, P, D = 3, 4, 1
        else:
            G, P, D = 3, 3, 3
        
        criticite = G * P * D
        
        # Détermination du niveau
        if criticite <= 20:
            niveau = "Acceptable 🟢"
        elif criticite <= 40:
            niveau = "Tolérable 🟡"
        elif criticite <= 60:
            niveau = "Préoccupant 🟠"
        elif criticite <= 80:
            niveau = "Critique 🔴"
        else:
            niveau = "Inacceptable ⚫"
        
        return G, P, D, criticite, niveau
    
    # Traiter chaque observation
    rows_result = []
    
    for idx, row in df_nc.iterrows():
        ref = row["ref"]
        type_eq = row["type"]
        observations = row["observations"]
        
        if observations and observations.strip():
            # Séparer les observations par " | "
            obs_list = observations.split(" | ")
            
            for obs in obs_list:
                if obs.strip():
                    G, P, D, criticite, niveau = calculer_criticite(obs)
                    rows_result.append({
                        "Réf": ref,
                        "Type": type_eq,
                        "Observation": obs,
                        "G": G,
                        "P": P,
                        "D": D,
                        "Criticité": criticite,
                        "Niveau": niveau
                    })
    
    if rows_result:
        df_risques = pd.DataFrame(rows_result)
        
        # Fonction de style pour colorer selon le niveau
        def colorier_niveau(val):
            if "🟢" in val:
                return "background-color: #d4edda; color: #155724"
            elif "🟡" in val:
                return "background-color: #fff3cd; color: #856404"
            elif "🟠" in val:
                return "background-color: #ffe5d0; color: #a0522d"
            elif "🔴" in val:
                return "background-color: #f8d7da; color: #721c24"
            elif "⚫" in val:
                return "background-color: #343a40; color: #ffffff"
            return ""
        
        # Afficher le DataFrame stylisé
        st.subheader("📋 Matrice des Risques Détaillée")
        
        df_styled = df_risques.style.applymap(colorier_niveau, subset=["Niveau"])
        st.dataframe(df_styled, use_container_width=True)
        
        st.markdown("---")
        
        # Heatmap Plotly
        st.subheader("🔥 Heatmap des Risques par Type et Niveau")
        
        # Préparer les données pour la heatmap
        df_heatmap = df_risques.copy()
        df_heatmap["Niveau_simple"] = df_heatmap["Niveau"].apply(lambda x: x.split()[0])
        
        # Compter les occurrences
        df_heatmap_count = df_heatmap.groupby(["Type", "Niveau_simple"]).size().reset_index(name="count")
        
        if len(df_heatmap_count) > 0:
            fig_heatmap = px.density_heatmap(df_heatmap_count, x="Type", y="Niveau_simple", z="count",
                                             labels={"Type": "Type d'équipement", "Niveau_simple": "Niveau de risque", "count": "Nombre d'occurrences"},
                                             color_continuous_scale="YlOrRd")
            fig_heatmap.update_layout(height=500)
            st.plotly_chart(fig_heatmap, use_container_width=True)
    else:
        st.info("Aucune non-conformité à analyser")

# ============================================================================
# 7. PAGE "🧮 Capacité Opérationnelle"
# ============================================================================

elif menu == "🧮 Capacité Opérationnelle":
    st.title("🧮 Capacité Opérationnelle")
    st.markdown("---")
    
    conn = sqlite3.connect("gse.db")
    types_list = pd.read_sql_query("SELECT nom FROM types_equipement", conn)["nom"].tolist()
    conn.close()
    
    with st.form("form_capacite"):
        col_c1, col_c2 = st.columns(2)
        
        with col_c1:
            nb_vols = st.number_input("Nombre de vols quotidiens", min_value=0, value=100)
            temps_intervention = st.number_input("Temps moyen par intervention (min)", min_value=0, value=15)
            duree_exploitation = st.number_input("Durée exploitation (heures)", min_value=1, value=10)
        
        with col_c2:
            type_selectionne = st.selectbox("Type d'équipement", options=types_list)
            coef_securite = st.number_input("Coefficient de sécurité", min_value=1.0, value=1.5, step=0.1)
        
        submit_capacite = st.form_submit_button("Calculer")
    
    if submit_capacite:
        # Calculs
        demande = (nb_vols * temps_intervention) / 60  # en heures
        
        conn = sqlite3.connect("gse.db")
        
        # Compter le nombre d'équipements 'Actif' de ce type
        nb_actif = pd.read_sql_query("""
            SELECT COUNT(*) as nb
            FROM equipements e
            JOIN types_equipement t ON e.type_id = t.id
            WHERE t.nom = ? AND e.statut = "Actif"
        """, conn, params=(type_selectionne,))["nb"].iloc[0]
        
        conn.close()
        
        # Capacité totale
        capacite = nb_actif * duree_exploitation
        
        # Taux d'utilisation
        if capacite > 0:
            taux = (demande / capacite) * 100
        else:
            taux = 0
        
        # Affichage des résultats
        st.markdown("---")
        st.subheader("📈 Résultats de l'Analyse")
        
        col_r1, col_r2, col_r3 = st.columns(3)
        
        with col_r1:
            st.metric("Demande (heures)", f"{demande:.1f}h")
        
        with col_r2:
            st.metric("Capacité (heures)", f"{capacite:.1f}h", delta=f"{nb_actif} équipements actifs")
        
        with col_r3:
            st.metric("Taux d'utilisation", f"{taux:.1f}%")
        
        st.markdown("---")
        
        # Jauge Plotly
        fig_jauge = px.scatter(
            x=[taux],
            y=[1],
            range_x=[0, 150],
            range_y=[0.5, 1.5],
            color=[taux],
            color_continuous_scale=["green", "yellow", "red"],
            size=[20],
            labels={"x": "Taux d'utilisation (%)"}
        )
        fig_jauge.update_traces(marker=dict(symbol="square"))
        fig_jauge.update_layout(
            height=200,
            xaxis_title="Taux d'utilisation (%)",
            yaxis=dict(showticklabels=False, showgrid=False),
            showlegend=False,
            coloraxis_showscale=False
        )
        st.plotly_chart(fig_jauge, use_container_width=True)
        
        # Barre de progression
        st.progress(min(taux / 100, 1.0))
        
        # Verdict
        st.subheader("🎯 Verdict")
        
        if taux < 70:
            st.success("✅ Capacité suffisante - Marge de sécurité confortable")
        elif taux <= 90:
            st.warning("⚠️ Capacité limite - Surveiller l'évolution du trafic")
        else:
            st.error("❌ Capacité insuffisante - Renforcement nécessaire")
        
        # Recommandation
        if taux > 90 and capacite > 0:
            nb_supplementaire = int((demande * coef_securite / duree_exploitation) - nb_actif) + 1
            st.info(f"💡 Recommandation : Ajouter {nb_supplementaire} équipement(s) supplémentaire(s) pour maintenir le coefficient de sécurité de {coef_securite}")

# ============================================================================
# 8. PAGE "🎯 Plan d'Action"
# ============================================================================

elif menu == "🎯 Plan d'Action":
    st.title("🎯 Plan d'Action Correctif")
    st.markdown("---")
    
    conn = sqlite3.connect("gse.db")
    
    # Récupérer toutes les inspections non conformes
    df_nc = pd.read_sql_query("""
        SELECT e.ref, t.nom as type, i.observations
        FROM inspections i
        JOIN equipements e ON i.ref_equipement = e.ref
        JOIN types_equipement t ON e.type_id = t.id
        WHERE i.statut_conformite = "Non Conforme"
    """, conn)
    
    conn.close()
    
    def generer_action(observation):
        """
        Génère une action corrective basée sur des mots-clés
        Retourne : (Action, Échéance, Priorité)
        """
        obs_lower = observation.lower()
        
        if "macaron" in obs_lower:
            return "Passage visite technique", "J+7", "P1"
        elif "pneu" in obs_lower:
            return "Remplacement pneumatiques", "J+3", "P1"
        elif "extincteur" in obs_lower:
            return "Remplacement/recharge extincteur", "J+3", "P1"
        elif "fuite" in obs_lower or "huile" in obs_lower:
            return "Diagnostic + réparation circuit", "J+5", "P1"
        elif "âge" in obs_lower or "age" in obs_lower or "dépassé" in obs_lower:
            return "Planification remplacement", "M+6", "P2"
        else:
            return "Maintenance préventive", "M+1", "P3"
    
    # Générer le plan d'action
    rows_plan = []
    
    for idx, row in df_nc.iterrows():
        ref = row["ref"]
        observations = row["observations"]
        
        if observations and observations.strip():
            obs_list = observations.split(" | ")
            
            for obs in obs_list:
                if obs.strip():
                    action, echeance, priorite = generer_action(obs)
                    rows_plan.append({
                        "Réf": ref,
                        "Observation": obs,
                        "Action Proposée": action,
                        "Priorité": priorite,
                        "Échéance": echeance
                    })
    
    if rows_plan:
        df_plan = pd.DataFrame(rows_plan)
        
        # Trier par priorité
        df_plan["Priorité_num"] = df_plan["Priorité"].apply(lambda x: int(x[1]))
        df_plan = df_plan.sort_values(["Priorité_num", "Échéance"])
        df_plan = df_plan.drop("Priorité_num", axis=1)
        
        # Afficher le tableau
        st.subheader("📋 Plan d'Action Détaillé")
        
        st.dataframe(df_plan, use_container_width=True)
        
        st.markdown("---")
        
        # Résumé par priorité
        st.subheader("📊 Résumé par Priorité")
        
        col_p1, col_p2, col_p3 = st.columns(3)
        
        nb_p1 = len(df_plan[df_plan["Priorité"] == "P1"])
        nb_p2 = len(df_plan[df_plan["Priorité"] == "P2"])
        nb_p3 = len(df_plan[df_plan["Priorité"] == "P3"])
        
        with col_p1:
            st.metric("Actions Priorité 1 (Urgent)", nb_p1)
            if nb_p1 > 0:
                st.error("⚠️ Actions immédiates requises")
        
        with col_p2:
            st.metric("Actions Priorité 2 (Important)", nb_p2)
            if nb_p2 > 0:
                st.warning("📅 Planifier dans les 6 mois")
        
        with col_p3:
            st.metric("Actions Priorité 3 (Standard)", nb_p3)
            if nb_p3 > 0:
                st.info("📋 Maintenance courante")
        
        st.markdown("---")
        
        # Export
        st.subheader("💾 Export du Plan d'Action")
        
        csv = df_plan.to_csv(index=False, sep=";")
        st.download_button(
            label="📥 Télécharger en CSV",
            data=csv,
            file_name="plan_action_gse.csv",
            mime="text/csv"
        )
    else:
        st.success("✅ Aucune action corrective nécessaire - Tous les équipements sont conformes !")

# ============================================================================
# FOOTER
# ============================================================================

st.sidebar.markdown("---")
st.sidebar.markdown("**GSE Audit Pro** v1.0")
st.sidebar.markdown("Application d'audit des équipements de support au sol aéroportuaire")
