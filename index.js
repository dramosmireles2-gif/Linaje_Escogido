function handleAlpha(e) {
  e.preventDefault();
  // TODO: conectar con Supabase
  // const { data, error } = await supabase.from('registros_alpha').insert([{ nombre, email, telefono }])
  alert('¡Registro recibido! Nos pondremos en contacto contigo pronto. 🙌');
  e.target.reset();
}

function handleOracion(e) {
  e.preventDefault();
  // TODO: conectar con Supabase
  // const { data, error } = await supabase.from('peticiones_oracion').insert([{ peticion, nombre, email, telefono, origen, como_entero, decision_jesus }])
  alert('¡Tu petición fue enviada! Estaremos orando por ti. 🙏');
  e.target.reset();
}
